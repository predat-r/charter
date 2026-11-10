import json,sys
from pathlib import Path
p=Path(sys.argv[1] if len(sys.argv)>1 else 'train.jsonl')
for n,line in enumerate(p.open(),1):
 r=json.loads(line); m=json.loads(r['messages'][1]['content'].split('\n',1)[1]); y=json.loads(r['messages'][2]['content'])
 ids={c['id']:c for c in m['columns']}
 assert m['rowCount']>0 and set(y)=={'charts'}
 for c in m['columns']:
  assert c['nullCount']<=m['rowCount'] and c.get('distinctCount',0)<=m['rowCount']-c['nullCount']
 for i,ch in enumerate(y['charts']):
  assert set(ch)=={'chartTypeId','x','y','aggregation','score'}
  assert ch['x'] in ids and (ch['y'] is None or ch['y'] in ids)
  assert 0<=ch['score']<=1 and (i==0 or ch['score']<=y['charts'][i-1]['score'])
print(f'{n} rows validated')
