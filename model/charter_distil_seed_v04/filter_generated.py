#!/usr/bin/env python3
"""Strict filtering of Distil Labs teacher predictions and synthetic chat JSONL.

Usage: python3 filter_generated.py input.jsonl [accepted.jsonl]
This rejects structurally invalid outputs; analytical correctness still needs human review.
"""
import json, sys
from pathlib import Path
from validate import extract_meta, validate_plan


def parse_record(record):
    if 'prompt' in record and 'prediction' in record:
        meta=extract_meta(record['prompt'])
        predicted=record['prediction']
        answer=predicted['content'] if isinstance(predicted,dict) else predicted
        return meta,answer
    if 'messages' in record:
        msgs=record['messages']
        meta=extract_meta(msgs)
        answer=next(m['content'] for m in msgs if m['role']=='assistant')
        return meta,answer
    raise ValueError('unrecognized JSONL layout; expected prediction or messages')

def main(path,out):
    accepted=[]; rejected=[]
    for index,line in enumerate(path.read_text().splitlines(),1):
        if not line.strip():continue
        try:
            record=json.loads(line)
            meta,answer=parse_record(record)
            errors=validate_plan(meta,answer)
            if errors:rejected.append({'line':index,'reasons':errors})
            else:accepted.append(record)
        except Exception as exc:
            rejected.append({'line':index,'reasons':[str(exc)]})
    out.write_text(''.join(json.dumps(row,separators=(',',':'))+'\n' for row in accepted))
    reject_path=out.with_name(out.stem+'_rejected.json')
    reject_path.write_text(json.dumps(rejected,indent=2)+'\n')
    print(f'Input: {len(accepted)+len(rejected)}; accepted: {len(accepted)}; rejected: {len(rejected)}')
    print(f'Accepted: {out}\nReject report: {reject_path}')
    print('NOTE: Passing structural checks DOES NOT verify analytical usefulness or data leakage.')
    return int(bool(rejected))

if __name__=='__main__':
    if len(sys.argv)<2:sys.exit('Usage: python3 filter_generated.py <input.jsonl> [accepted.jsonl]')
    source=Path(sys.argv[1]);dest=Path(sys.argv[2]) if len(sys.argv)>2 else source.with_name(source.stem+'_accepted.jsonl')
    main(source,dest)
