# Charter Distil Labs seed (pilot)

Model: LFM2.5-350M; teacher/judge: zai.glm-5.3-low-thinking. Contains 100 pilot train and 20 pilot test examples, converted to Distil Labs question-answering conversation format.

## Upload (does not start training)

```sh
distil dataset create --data charter_distil_seed
```

Save the returned dataset ID. Check status:

```sh
distil dataset status DATASET_ID
```

Before any paid job, inspect the reference examples and run `distil teacher-evaluation create-from-dataset --dry-run DATASET_ID`. Do not assume the examples are teacher-validated: the pilot references were synthetic and structurally validated, not independently checked for analytical quality. The 20 pilot test cases are insufficient as a rigorous benchmark. Reserve a later, human-reviewed test set on unseen schemas for proper evaluation.

The config targets 1,900 *new* generated rows, not an exact final count (generation batches can overshoot). Training is **not** launched by dataset creation.
