# Charter — Distil Labs dataset v0.4

**Purpose:** Better teacher evaluation and prompt compliance; compare Kimi K3 Max Thinking vs GLM-5.3 High Thinking with the **same judge and test set**. The student target remains `LFM2.5-350M`.

## What changed from v0.3

- Retained the same 212 training examples and 70 held-out test examples, unmodified. This supports **within-v0.4** Kimi/GLM comparisons, NOT direct judge-score comparison to v0.3.
- New concise `task_description` includes a fully formed JSON input/output example and explicit constraints. This **changes the task prompt**; the new version is its own baseline. Keep it constant for both teachers.
- Added judge guidance that accepts distinct but analytically defensible chart plans.
- Set judge to `zai.glm-5.3-high-thinking` for both teachers.
- Set `evaluation.num_few_shot_examples: 3` rather than default 1; this is an experimental hypothesis, not a proven fix.
- Set `synthgen.output_is_json: true`, `teacher_temperature: 0.6` and 3 positive generation examples. These apply to **generation**, not strict JSON enforcement during teacher evaluation.
- Set `synthgen.train_generation_target: 1792` additional rows (14 x 128 default batches), yielding ~2,004 total BEFORE filtering, subject to Distil's actual result. This does not start generation.
- Includes `filter_generated.py` (reject-only) and `validate.py` from v0.3. Structural checks are not proof of analytical quality.

## Local validation (free)

```bash
python3 charter_distil_seed_v04/validate.py
```

## Upload v0.4

```bash
distil dataset create --data charter_distil_seed_v04
```

Record the dataset ID. The uploaded **default** teacher is Kimi K3 Max Thinking. For a GLM comparison, use `--config charter_distil_seed_v04/glm-config.yaml` on a teacher evaluation, with the SAME uploaded dataset ID.

## Evaluate Kimi (estimate first)

```bash
distil teacher-evaluation create-from-dataset --dry-run DATASET_ID
# If acceptable:
distil teacher-evaluation create-from-dataset DATASET_ID
```

## Evaluate GLM on exactly the same v0.4 cases (optional comparison)

```bash
distil teacher-evaluation create-from-dataset --config charter_distil_seed_v04/glm-config.yaml --dry-run DATASET_ID
distil teacher-evaluation create-from-dataset --config charter_distil_seed_v04/glm-config.yaml DATASET_ID
```

For both, `evaluation.llm_as_a_judge_model_name` stays `zai.glm-5.3-high-thinking` and few-shot count stays 3.

## Inspect predictions before spending on synthetic generation

```bash
distil teacher-evaluation metrics EVALUATION_ID
distil teacher-evaluation download-predictions EVALUATION_ID
python3 charter_distil_seed_v04/validate.py EVALUATION_ID-teacher-evaluation-predictions.jsonl
python3 charter_distil_seed_v04/filter_generated.py EVALUATION_ID-teacher-evaluation-predictions.jsonl
```

Do not feed evaluation predictions into training. After generation, download the generated dataset and filter its **training** rows, then manually audit for semantic quality; creating a filtered local file does not automatically update Distil's remote dataset. Re-upload a curated dataset before fine-tuning if necessary. In v0.3, 24/70 predictions failed strict structural validation. Target at least 95% before generating at scale.

Docs: https://www.distillabs.ai/docs/reference/config/ ; https://www.distillabs.ai/docs/reference/job-description/ ; https://www.distillabs.ai/docs/build/teacher-evaluation/
