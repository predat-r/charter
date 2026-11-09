#!/usr/bin/env python3
"""Inspect a downloaded Distil Labs held-out evaluation dataset. Standard-library only."""
import argparse,collections,json,re,sys
from pathlib import Path

def load(path):
 with open(path,encoding='utf-8') as f:
  return [json.loads(line) for line in f if line.strip()]

def extract(row):
 msgs=row['messages']
 user=next(m['content'] for m in msgs if m['role']=='user')
 answer=next(m['content'] for m in msgs if m['role']=='assistant')
 return json.loads(user[user.find('{'):]),json.loads(answer)

def signature(m):
 return tuple(sorted((c['name'].casefold(),c['type']) for c in m.get('columns',[])))

def validate(m,a):
 errors=[]; n=m.get('rowCount'); cols=m.get('columns',[])
 if not isinstance(n,int) or isinstance(n,bool) or n<1: errors.append('invalid row count')
 byid={}
 names=[]
 for c in cols:
  cid=c.get('id');name=c.get('name');typ=c.get('type')
  if not isinstance(cid,int) or isinstance(cid,bool) or cid in byid:errors.append('duplicate/invalid column ID')
  else:byid[cid]=c
  if not isinstance(name,str) or not name.strip(): errors.append('invalid name')
  else:names.append(name.casefold())
  if typ not in ('numeric','categorical','date'):errors.append('invalid column type')
  null=c.get('nullCount',0);dist=c.get('distinctCount')
  if not isinstance(null,int) or null<0 or (isinstance(n,int) and null>n):errors.append('invalid null count')
  if dist is not None and (not isinstance(dist,int) or dist<0 or (isinstance(n,int) and isinstance(null,int) and dist>n-null)):errors.append('invalid distinct count')
 if len(names)!=len(set(names)):errors.append('duplicate column names')
 if set(a)!={'charts'} or not isinstance(a.get('charts'),list) or len(a['charts'])>20: return errors+['invalid top-level answer']
 last=1.01;seen=set()
 for i,c in enumerate(a['charts']):
  if set(c)!={'chartTypeId','x','y','aggregation','score'}:errors.append(f'chart {i}: fields');continue
  t,x,y,g,s=(c[k] for k in ['chartTypeId','x','y','aggregation','score'])
  if type(t)!=int or t not in range(1,7):errors.append(f'chart {i}: type');continue
  if type(x)!=int or x not in byid or (y is not None and (type(y)!=int or y not in byid)): errors.append(f'chart {i}: unknown column');continue
  xt=byid[x]['type'];yt=byid[y]['type'] if y is not None else None
  needagg=g in ('sum','avg','min','max','count')
  valid={1:xt=='categorical' and yt=='numeric' and needagg,2:xt=='date' and yt=='numeric' and needagg,3:xt=='numeric' and yt=='numeric' and y!=x and g is None,4:xt=='numeric' and y is None and g is None,5:xt=='categorical' and yt=='numeric' and g is None,6:xt=='categorical' and yt=='categorical' and y!=x and g=='count'}[t]
  if not valid:errors.append(f'chart {i}: invalid axes or aggregation')
  if type(s) not in (int,float) or not 0<=s<=1 or s>last:errors.append(f'chart {i}: score');
  last=s if type(s) in (int,float) else last
  sig=t,x,y,g
  if sig in seen:errors.append(f'chart {i}: duplicate chart')
  seen.add(sig)
  for v in [x,y]:
   if v is not None and byid[v].get('distinctCount',2)==1:errors.append(f'chart {i}: constant column')
 return errors

def main():
 p=argparse.ArgumentParser();p.add_argument('dataset_directory',type=Path);args=p.parse_args()
 path=args.dataset_directory
 test=load(path/'test.jsonl');train=load(path/'train.jsonl')
 failures=[]; sigs=set(); dupe=0; leakage=0
 trainsigs={signature(extract(r)[0]) for r in train}
 counts=collections.Counter();shape_counts=collections.Counter();domain=collections.Counter()
 for i,r in enumerate(test):
  try:m,a=extract(r);errs=validate(m,a)
  except Exception as e:errs=[f'parse: {e}'];m={};a={'charts':[]}
  if errs:failures.append({'row':i+1,'errors':errs,'dataset':m.get('dataset','?')})
  if 'columns' in m:
   sig=signature(m)
   if sig in sigs:dupe+=1
   if sig in trainsigs:leakage+=1
   sigs.add(sig)
   shape_counts[len(m['columns'])]+=1
   domain[m.get('dataset','unknown').split(' - ')[0]]+=1
  for c in a.get('charts',[]):counts[c['chartTypeId']]+=1
 result={'test_examples':len(test),'train_examples':len(train),'valid_test_examples':len(test)-len(failures),'invalid':failures[:100], 'identical_column_schema_repeats_test':dupe, 'identical_column_schema_overlap_train_test':leakage,'unique_column_schemas':len(sigs),'chart_type_counts':counts,'column_count_distribution':shape_counts}
 print(json.dumps(result,indent=2,default=dict))
 if failures or leakage:sys.exit(1)

if __name__=='__main__': main()
