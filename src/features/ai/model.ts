import {
  CreateMLCEngine,
  prebuiltAppConfig,
  type MLCEngineInterface,
  type InitProgressReport,
} from "@mlc-ai/web-llm";

const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

let enginePromise: Promise<MLCEngineInterface> | null = null;

export type ModelProgressCallback = (report: InitProgressReport) => void;

export function isWebGPUSupported(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export async function getModel(
  onProgress?: ModelProgressCallback,
): Promise<MLCEngineInterface> {
  if (!isWebGPUSupported()) {
    throw new Error("WebGPU is not supported by this browser.");
  }

  if (!enginePromise) {
    const available = prebuiltAppConfig.model_list.some(
      (model) => model.model_id === MODEL_ID,
    );

    if (!available) {
      throw new Error(`Model ${MODEL_ID} is not available.`);
    }

    enginePromise = CreateMLCEngine(
      MODEL_ID,
      {
        initProgressCallback: onProgress,
      },
      {
        context_window_size: 8192,
      },
    ).catch((error) => {
      enginePromise = null;
      throw error;
    });
  }

  return enginePromise;
}

export async function generateJSON(
  systemPrompt: string,
  userPrompt: string,
  schema: string,
): Promise<unknown> {
  const engine = await getModel();

  const completion = await engine.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0,
    max_tokens: 512,
    response_format: {
      type: "json_object",
      schema,
    },
  });

  const content = completion.choices[0]?.message.content;

  if (!content) {
    throw new Error("The AI model returned an empty response.");
  }

  return JSON.parse(content);
}
