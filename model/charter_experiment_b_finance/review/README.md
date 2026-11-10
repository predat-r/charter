# Charter — combined general + finance training dataset

## Dataset preparation

- Starts from the previously approved, metadata-corrected Charter general training dataset (1,898 examples).
- Adds finance training examples from the successful generation run (2,083 records: 210 seeds + 1,873 generated).
- Omits 38 exact-duplicate finance metadata records already present in the general set, preserving the original label.
- Removes one objectively invalid bar chart in a residential mortgage loan-level example; all other charts in that example remain.
- Final training count: 3,943.
- Retains the identical 399-example held-out test file from Experiment A. No test examples were added to training.
- The approved general-purpose training config is used, with synthetic generation disabled.

## Limitations

Mechanical validation establishes structure and type compatibility, not economic/financial analytical correctness. The heuristic review queue lists potentially questionable aggregations or high-cardinality categorical axes; these have NOT been silently changed. Data is predominantly synthetic, so results do not replace a truly independent real-data benchmark.

## Files

- charter_training/: files for `distil dataset create --data ./charter_training`
- review/audit_summary.json: measured counts and integrity results
- review/finance_duplicates_omitted.csv: removed duplicate records
- review/label_corrections.csv: one chart removed with original JSON recorded
- review/heuristic_review_queue.csv: candidate finance/semantic review
- review/finance_generation_*: provenance of synthetic generator configuration

## CLI

```sh
distil dataset create --data ./charter_training
distil slm create-from-dataset --dry-run NEW_DATASET_ID
```

Training job will only start when the paid command without `--dry-run` is issued.
