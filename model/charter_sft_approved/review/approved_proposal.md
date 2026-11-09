# Charter — consolidation audit and proposed corrections

Status: **Proposal only. No uploaded source dataset was edited. No corrected dataset was produced.**

## Source comparison

- `train(1).jsonl`: 1,898 training records.
- `train(2).jsonl`: 1,898 training records, byte-for-byte identical to `train(1).jsonl`.
- `test(1).jsonl`: 70 original evaluation records.
- `test(2).jsonl`: 399 evaluation records: 91 prepared seed tests (the 70 originals, with one metadata correction, plus 21 additional profiled statistical schemas) and 308 newly generated examples.
- 69 of 70 older test records are exact matches in the new test file. The remaining record, `Railway bridge inspection — holdout scenario 1`, already differs by a sensible correction: `bridge_id.distinctCount` is 101 rather than 116, because there are only 101 non-null observations.
- **Proposed combined counts: 1,898 train / 399 test**. Do not append either training file to the other or append `test(1)` to `test(2)`.

## Structural and split checks

- All 2,297 example messages were parseable. All chart plans passed programmatic checks for chart keys, chart types, axis-type compatibility, ID references, null fields, score range/order, duplicate chart signatures, and allowed aggregations.
- No exact duplicated metadata across training and evaluation; no identical sets of column names and types across training/evaluation.
- Train: 1,712 distinct name/type schema signatures, 1,898 distinct metadata objects. Test: 353 distinct name/type signatures, 399 distinct metadata objects.
- Two test records are similar to training on column-name Jaccard similarity >=0.75 (rows 209 and 356). This is **near-overlap**, not proven leakage. Recommend manual review; if we want a strict out-of-schema benchmark, exclude these two from that benchmark rather than relabel them.
- 175 training and 47 evaluation plans correctly have the *form* of an empty chart list. Whether each empty plan is analytically justified requires human review.

## Clear metadata defects

- 32 training rows and 1 evaluation row have `distinctCount > rowCount - nullCount` (impossible metadata).
- Test row 270: `Procurement vendor registry — master data extract`, column `tax_registration_no` has `distinctCount:14876`, but only `14860` non-null rows.
- These are objectively inconsistent; values are generated descriptions, not measured counts. **Recommended conservative fix:** drop only the impossible `distinctCount` property, rather than invent the true cardinality. Keep the remainder of the record unchanged, then revalidate.

## Heuristic review flags — not automatic defects

The review queue has 251 *flag occurrences*, which consolidate to 31 clearly invalid training rows, 1 clearly invalid test row, 76 training rows with semantic review flags, and 75 evaluation rows with semantic review flags (some rows have more than one flag). The 32 invalid training `distinctCount` occurrences affect 31 rows.

- 52 training and 6 evaluation chart labels were flagged as possible inappropriate `sum` aggregations. Many are **false positives**: total generation in MWh, distance traveled, goals scored, and total outage duration are meaningful additive quantities when row granularity supports it.
- 48 training and 112 evaluation chart labels use an identifier/code-like categorical column, e.g. `station_code`, `machine_code`, `turbine_id`, or `region_code`. These are often **legitimate** categorical groupings; reject them only for actual cardinality or meaning problems.
- The validator found no invalid chart keys, types, reference IDs, duplicate chart signatures, or score ordering problems. The semantic audit is heuristic; it does not prove all chart labels are good.
- A small number of nontrivial semantically dubious cases could remain unflagged. Recommended targeted human review of all flagged rows and a random sample of unflagged examples before paid training.

## Evaluation quality

- 308 freshly generated cases extend the 91 prepared seed test cases, yielding 399 total. This is more than the minimum 300 requested.
- 353 distinct name/type schema signatures among the 399 evaluation examples; a sizable improvement from the older 70-case set with only 24 distinct signatures.
- These are still largely **synthetic and teacher-labeled** datasets, with only 21 seed cases profiled from packaged statistical datasets. Therefore they measure model quality on schema-rich synthetic tests, not fully independent production generalization.
- Consider reporting separate metrics for the 21 real-profile cases and for the 308 newly synthesized ones, to avoid a single aggregate score hiding weaknesses.

## Configuration proposal (pending approval)

- Use the updated job description / system task contract from `job_description(2).json` only if approved. Both retain the chart contract but generation instructions differ.
- For SFT, start from `config(2).yaml` because it sets 8 parallel requests and a valid teacher temperature of 0.6; set both generation targets to 0 in the *new copy* for a training-only operation. Keep existing LoRA r=64, 4 epochs and learning rate 5e-5 as initial experimental choices, not as a guarantee.
- Remove deprecated options `evaluation.num_few_shot_examples` and `synthgen.num_negative_exemplars_per_generation` in a new configuration copy when supported by the installed CLI; they have no effect according to the observed logs. Double-check the precise Distil SFT command against `distil --help` before launching.

## Proposed action plan — await approval

1. Keep `train(1)` once and `test(2)` once, retaining train/test separation and original source files.
2. Remove 33 impossible `distinctCount` properties; document each edit in an audit changelog.
3. Manually assess flagged semantics, especially nonadditive measures and high-cardinality identifier axes; alter or remove only confirmed-bad labels, never automatically discard valid station/region groupings.
4. Decide if the two near-overlap evaluation rows should be excluded from the strict holdout subset while remaining available for secondary evaluation.
5. Revalidate the complete result and package a new Distil Labs upload directory **after explicit approval**.

## Deliverables available now

- `charter_combination_audit.json`: machine-readable counts, overlap statistics, and near-overlap examples.
- `charter_proposed_review_queue.csv`: all 251 flagged occurrences with split, 1-based source row, type, and details.
- `charter_proposal_audit.py`: read-only validation script.

**No changes have been applied to either uploaded dataset.**
