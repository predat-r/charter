# Charter — Finance/Stocks Synthetic 2,000

This is a **new finance-only generation** job, not a training run and not 2,000 pre-labeled training rows.

- **210** validated finance-only seed training examples, including 172 hand-authored schema variations across 43 hand-designed financial data suites and selected finance-specific examples from the previously approved training set.
- **2,000 additional** synthetic training examples requested from Kimi. Actual accepted count may differ; inspect logs and output.
- **399** untouched held-out evaluation examples from the previous approved Experiment A. These are for evaluation only, never for teacher seed generation.
- Financial coverage: stocks/OHLCV, filings, factors, valuations, PSX, derivatives, futures, funds, credit, bonds, banking, FX, insurance, VC, PE, M&A, settlement, risk and tricky unplottable schemas.
- `llm_num_parallel_requests: 8`, `teacher_temperature: 0.6`, `generation_iteration_size: 64`, strict finance-specific acceptance instructions. Parallelism is a limit, not a speed guarantee.
- The seed chart targets are human-authored *templates*, structurally validated by script; they are not claimed to have undergone independent expert or LLM review. Some large datasets represent panel data; all charts rely on metadata only and do not assert findings.

## Run

From the directory containing `charter_finance_2000/`:

```bash
distil dataset create --data ./charter_finance_2000
```

Use the returned **dataset ID**:

```bash
distil dataset generate-synthetic-data-train --config ./charter_finance_2000/config.yaml --job-description ./charter_finance_2000/job_description.json <DATASET_ID>
```

The CLI syntax may differ by version; verify with `distil dataset --help` if the subcommand is unavailable. Record the generation job ID.

```bash
distil dataset status <GENERATION_JOB_ID>
distil dataset logs <GENERATION_JOB_ID> | tail -25
```

Once generated, download and conduct an independent audit before fine-tuning. **Do not merge into the 399 held-out set**. Keep Experiment A frozen so comparisons remain meaningful.

## Important design constraint

This finance-only expansion intentionally improves finance-specific performance. It may harm Charter's domain-independent ability if trained alone. For a general-purpose Charter model, combine reviewed finance additions with the 1,898 diverse original training examples in a later SFT package.
