# Charter / Distil Labs seed v0.2

This version updates task/generation/judge instructions and adds 12 challenging train examples and 8 held-out test examples. It retains the earlier 100 train and 20 test examples for comparison. Total: **112 train, 28 test**.

## What changed
- Explicitly prohibits `{}`; allows `{"charts":[]}` for genuinely unchartable data.
- Defines JSON field types, decimal 0–1 scores, and strict descending rank.
- Adds cases with only identifiers, constants, single rows, ratios, balances, repeated dates, missingness, and low chart counts.
- Warns against summing ratios, percentages, balances, prices and stocks.
- Adds independent structural validator: `python3 validate.py` and `python3 validate.py /path/to/predictions.jsonl`.

## Next steps

```sh
python3 validate.py
distil dataset create --data charter_distil_seed_v02
distil teacher-evaluation create-from-dataset --dry-run DATASET_ID
distil teacher-evaluation create-from-dataset DATASET_ID
```

Do **not** start synthetic generation or student training until evaluation predictions are inspected. Synthetic seeds are not teacher-validated; the newly added adversarial cases are intended to test compliance, not claim empirically ideal charts. This is a small pilot, not a rigorous production test. Scores are subjective preferences, not empirical evidence.

Note: training examples and test examples remain partly blueprint-derived; subsequent generation should emphasize independent realistic schemas, and final tests should use unseen real datasets.
