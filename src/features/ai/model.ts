
import {
  CreateMLCEngine,
  prebuiltAppConfig,
  type MLCEngineInterface,
  type InitProgressReport,
} from "@mlc-ai/web-llm";

const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

type ProgressListener = (report: InitProgressReport) => void;

const listeners = new Set<ProgressListener>();

let enginePromise: Promise<MLCEngineInterface> | null = null;
let latestProgress: InitProgressReport | null = null;

export function subscribeModelProgress(
  listener: ProgressListener,
): () => void {
  listeners.add(listener);

  if (latestProgress) {
    listener(latestProgress);
  }

  return () => {
    listeners.delete(listener);
  };
}

function publishProgress(report: InitProgressReport): void {
  latestProgress = report;

  for (const listener of listeners) {
    listener(report);
  }
}

async function getModel(): Promise<MLCEngineInterface> {
  if (!navigator.gpu) {
    throw new Error(
      "WebGPU is unavailable. Use a WebGPU-enabled browser.",
    );
  }

  if (!enginePromise) {
    const available = prebuiltAppConfig.model_list.some(
      (model) => model.model_id === MODEL_ID,
    );

    if (!available) {
      throw new Error(
        `Model ${MODEL_ID} is not supported by this WebLLM version.`,
      );
    }

    enginePromise = CreateMLCEngine(MODEL_ID, {
      initProgressCallback: publishProgress,
    }).catch((error: unknown) => {
      enginePromise = null;
      latestProgress = null;
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
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0,
    max_tokens: 2048,
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
