# Charter — additional held-out evaluation set (Distil Labs)

## Contents

- `train.jsonl`: 1,898 original training records, unchanged.
- `test.jsonl`: 70 original test records (one impossible distinct-count value corrected) plus **21 independently profiled real datasets** included in the `statsmodels` package (91 seed test records).
- `config.yaml`: Kimi K3 Max Thinking teacher; **8 parallel requests**; generate **300 additional test records**; zero train generation.
- `job_description.json`: original prediction contract retained; improved instructions for diverse, realistic metadata and analytically defensible outputs.
- `real_seed_manifest.json`: source dataset names, counts, and provenance.
- `audit_generated.py`: checks structural validity and exact-schema train/test overlaps in any downloaded output directory.

**Expected output:** approximately 391 test records: 70 existing (one metadata correction) + 21 real datasets + target 300 newly generated. A generation target is not a guarantee; the platform may complete short (as the prior training run did) or slightly exceed its target. The new 300 are *synthetic* even though 21 new seeds are profiled from real data.

## Run

From the directory containing these files:

```bash
# 1. Upload a new dataset; keep your previous successful dataset unchanged.
distil dataset create --data ./charter_eval_300

# 2. Substitute the newly printed dataset ID, NOT the previous generation ID.
distil dataset generate-synthetic-data-test \
  --config ./charter_eval_300/config.yaml \
  --job-description ./charter_eval_300/job_description.json \
  <NEW_DATASET_ID>

# 3. Track the new generation dataset ID printed by the command.
distil dataset status <GENERATED_DATASET_ID>
distil dataset logs <GENERATED_DATASET_ID> | tail -20

# 4. After success, download and audit.
distil dataset download -d ./charter_eval_result <GENERATED_DATASET_ID>
python3 ./charter_eval_300/audit_generated.py ./charter_eval_result > ./charter_eval_audit.json
```

## Why these settings?

- `base.llm_num_parallel_requests: 8` follows Distil Labs support's recommendation to speed up the previous slow generation. Higher concurrency changes latency, not the target number of examples; provider rate limits still apply.
- `synthgen.generation_in_single_call: 2` reduces answer batching from 4 to 2, seeking fewer malformed outputs. This is a quality/speed trade-off and **not guaranteed** to improve acceptance.
- `synthgen.generation_iteration_size: 64` prints progress more often and limits per-iteration work; may add overhead.
- `synthgen.validation_similarity_threshold: 0.88` is stricter about near-duplicates than 0.95 and may *reduce acceptance*. Loosen to 0.93 if diversity filtering prevents sufficient yield.
- `synthgen.test_generation_target: 300`, `train_generation_target: 0`: explicitly generate held-out examples. `use_traces_as_context: false`: no production traces were supplied.
- Judge remains GLM-5.3 High Thinking, but **a synthetic Kimi-labeled test set primarily measures agreement with Kimi**, not objective correctness.

## Review requirements

1. Fix / reject invalid metadata, chart types, and aggregations; inspect flagged outputs manually.
2. Review 30–50 random cases plus all 0-chart cases and high-cardinality identifier cases.
3. Check semantic/near-duplicate schemas, not just exact names; exclude train/test leakage.
4. Keep this dataset locked for all baseline and post-tuning comparisons. Prior evaluation scores on the old 70-row set are not comparable.
5. Before training, test the untuned student on the same locked set; then evaluate the tuned student for valid JSON, semantic quality, inference speed and browser load/memory use.

## Note on production-generalization claims

These real datasets are a small fixed challenge subset. The 300 generated cases are still synthetic. A fully independent production benchmark requires unseen **actual uploaded file metadata** and expert-reviewed chart references; aim to add such cases separately as data becomes available. Do not train on any test-set row.
