#!/usr/bin/env python3
"""Validate Distil Labs JSONL seed rows or downloaded teacher predictions."""
import json, sys
from pathlib import Path
DIR=Path(__file__).parent

def validate_plan(meta,answer):
    err=[]
    try:
        plan=json.loads(answer) if isinstance(answer,str) else answer
        if not isinstance(plan,dict) or set(plan)!={'charts'} or not isinstance(plan['charts'],list): return ['top-level object must contain only charts array']
        charts=plan['charts']
    except Exception as e:return [f'invalid JSON: {e}']
    if len(charts)>20:err.append('too many charts')
    cols={c['id']:c for c in meta['columns']}
    seen=set();last=1.01
    for i,c in enumerate(charts):
        prefix=f'chart {i}'
        if not isinstance(c,dict) or set(c)!={'chartTypeId','x','y','aggregation','score'}:err.append(prefix+': wrong fields');continue
        t,x,y,a,s=(c.get(k) for k in ('chartTypeId','x','y','aggregation','score'))
        if type(s) not in (int,float) or not 0<=s<=1:err.append(prefix+': score out of [0,1]')
        elif s>last:err.append(prefix+': ranking not descending')
        if type(s) in (int,float):last=s
        if type(t)!=int or t not in range(1,7):err.append(prefix+': bad chart type');continue
        if type(x)!=int or x not in cols or (y is not None and (type(y)!=int or y not in cols)):
            err.append(prefix+': invented/malformed column ID');continue
        if cols[x].get('distinctCount')==1 or (y is not None and cols[y].get('distinctCount')==1):err.append(prefix+': constant column')
        xt,yt=cols[x]['type'],cols[y]['type'] if y is not None else None
        expected={1:("categorical","numeric"),2:("date","numeric"),3:("numeric","numeric"),4:("numeric",None),5:("categorical","numeric"),6:("categorical","categorical")}
        if (xt,yt)!=expected[t] or (y is not None and x==y):err.append(prefix+': incompatible axes')
        if ((t in (1,2) and a not in ('sum','avg','min','max','count')) or (t in (3,4,5) and a is not None) or (t==6 and a!='count')):
            err.append(prefix+': wrong aggregation')
        sig=(t,x,y,a)
        if sig in seen:err.append(prefix+': duplicate chart')
        seen.add(sig)
        if t in (1,2) and a=='sum' and y is not None:
            name=cols[y]['name'].lower()
            if any(token in name.split('_') for token in ('ratio','rate','margin','pct','percent','balance','price','stock','average','avg','roi','roe','roa')) or name in ('pe','pb','marketcap','market_cap'):
                err.append(prefix+': suspicious sum of nonadditive quantity')
    return err

def extract_meta(messages):
    user=next(m['content'] for m in messages if m['role']=='user')
    return json.loads(user[user.index('{'):])

def check_examples(name):
    rows=[json.loads(s) for s in (DIR/name).read_text().splitlines()]
    failures=[]
    for i,row in enumerate(rows,1):
        messages=row['messages'];err=validate_plan(extract_meta(messages),next(m['content'] for m in messages if m['role']=='assistant'))
        if err:failures.append((i,err))
    print(f'{name}: {len(rows)} examples, {len(failures)} failed')
    for i,e in failures[:20]:print(' ',i,', '.join(e))
    return len(failures)

def check_predictions(path):
    rows=[json.loads(s) for s in Path(path).read_text().splitlines() if s.strip()]
    errors=[]
    for i,row in enumerate(rows,1):
        meta=extract_meta(row['prompt'])
        result=validate_plan(meta,row['prediction']['content'])
        if result:errors.append((i,result))
    print(f'predictions: {len(rows)} cases, {len(errors)} structurally invalid')
    for i,err in errors:print(' ',i,', '.join(err))
if __name__=='__main__':
    if len(sys.argv)>1:check_predictions(sys.argv[1])
    else:
        errors=check_examples('train.jsonl')+check_examples('test.jsonl')
        sys.exit(bool(errors))
