# Charter SFT package — approved corrections

`charter_training/` is the Distil Labs upload directory.

* 1,898 training records in `train.jsonl` (one source copy, no duplicate concatenation).
* 399 evaluation records in `test.jsonl` (91 seeds and 308 generated).
* `config.yaml` has `synthgen.train_generation_target: 0` and `synthgen.test_generation_target: 0`.
* Training model: LFM2.5-350M; 4 LoRA epochs, r=64, learning rate 5e-5.
* 33 impossible `distinctCount` properties removed (32 train, 1 test); no guesses substituted. See `metadata_corrections.csv`.
* Chart labels remain unchanged. Heuristic semantic flags are not automatically removed.
* `strict_holdout_test.jsonl` contains 397 cases after excluding near-overlap original test rows 209 and 356, and can be used for secondary evaluation. The canonical upload test split remains all 399.
* Validation: both JSONL files parse, chart structural constraints pass, no exact metadata overlap between train and test.

Important: Test labels are largely synthetic teacher-generated plans, not ground truth. A broader assessment against real-world schemas and independent human review is still advisable.

### Launch preparation

From directory containing `charter_training`:

```sh
distil dataset create --data ./charter_training
```

Review `distil slm create-from-dataset --help` and use `--dry-run` on your new ID to verify cost before launching training.
