# Charter — Distil Labs seed v0.3

Student: **LFM2.5-350M**. Teacher: **GLM-5.3 High Thinking**. Evaluator: **GLM-5.3 Low Thinking** (held constant for comparison).

## What changed

- Existing 112 training and 28 test examples retained.
- Added 100 **train-only** schemas drawn from 25 new domain families (4 variants per family).
- Added 42 **evaluation-only** schemas drawn from 14 independent domain families (3 variants per family).
- Totals: **212 train**, **70 test**, all validated structurally. The new examples are **curated synthetic seed labels**, NOT teacher-generated or empirically proven correct.
- Updated task guidance to require full JSON, explicit `y:null` in histograms, no input echo, numeric [0,1] scores and descending ranking.
- Added a strict, no-repair JSONL filter for generation output. Structural validity alone cannot establish analytical validity.

**Important:** The held-out set contains variants within each family. Family separation from the added training families prevents simple variant leakage, but this is still a synthetic evaluation and cannot establish real-world generalization. Existing v0.2 test examples are preserved for approximate tracking; because prompt/instructions change, scores aren't a fully controlled comparison.

## Local validation

```bash
python3 charter_distil_seed_v03/validate.py
```

## Upload and evaluate

```bash
distil dataset create --data charter_distil_seed_v03
# Record the NEW dataset ID, then:
distil teacher-evaluation create-from-dataset --dry-run <dataset-id>
distil teacher-evaluation create-from-dataset <dataset-id>
```

The `config.yaml` explicitly chooses `zai.glm-5.3-high-thinking` as the teacher, and `zai.glm-5.3-low-thinking` as judge. Examine evaluation metadata after running to verify the teacher selection.

Do not generate training data until the teacher predictions have been downloaded and audited, particularly the **42 new held-out cases**.

## Validate downloaded teacher predictions

```bash
python3 charter_distil_seed_v03/filter_generated.py <downloaded-predictions.jsonl>
```

The script writes `_accepted.jsonl` and `_accepted_rejected.json`. It does not edit predictions, and rejected records must not be silently repaired. For a generated dataset, use the same filter only if its JSONL is in `messages` format; other Distil export formats need an adapter.

## Synthetic generation target

`synthgen.train_generation_target: 1900` specifies an estimated **1,900 generated training examples** if generation is run. Distil Labs may interpret targets according to its job semantics; verify a dry-run and output count first. If the target means 1,900 **additional** examples, 212 seeds plus 1,900 generated examples would yield approximately **2,112** training examples. Verify platform counting and actual output before assuming that total.

After generation, review a representative sample from *every domain* for relevance, misleading aggregations, and unintended repeated schema templates. Do not assume vendor quality gates guarantee perfect labels.
