"""Import a pinned dictionary as data; never execute upstream code."""
import csv, hashlib, json, re, sys, urllib.request
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parent.parent
revision='bc015ed2e24a7abef49fc6dbbb7fe32c1dadaf8b'
vendor=root/'data/vendor/ecdict'; vendor.mkdir(parents=True,exist_ok=True)
out=root/'data/english'; out.mkdir(parents=True,exist_ok=True)
for name in ['ecdict.csv','README.md','LICENSE']:
    target=vendor/name
    if not target.exists():
        request=urllib.request.Request(f'https://raw.githubusercontent.com/skywind3000/ECDICT/{revision}/{name}',headers={'User-Agent':'Shici-data-import'})
        with urllib.request.urlopen(request,timeout=60) as response:
            data=response.read()
        target.write_bytes(data)
source=(vendor/'ecdict.csv').read_bytes()
blob=hashlib.sha1(b'blob '+str(len(source)).encode()+b'\0'+source).hexdigest()
if blob!='c4ade63ea08cf39d9c3475e96929036d64d94c94':
    raise ValueError('Pinned ECDICT data hash mismatch: '+blob)
buckets={}; learning=[]; total=0; malformed=0; missing=0; seen=set()
tags={'core':('牛津核心标注','oxford'),'gk':('高考标注词汇','gk'),'cet4':('四级标注词汇','cet4'),'cet6':('六级标注词汇','cet6')}
with (vendor/'ecdict.csv').open(encoding='utf-8-sig',newline='') as handle:
    for row in csv.DictReader(handle):
        total+=1
        if None in row or not row.get('word') or row.get('translation') is None:
            malformed+=1; continue
        word=row['word'].strip(); meaning=row['translation'].replace('\\n','\n').strip()
        if not meaning: missing+=1
        item={'word':word,'meaning':meaning,'ipa':row['phonetic'],'exchange':row['exchange'],'definition':row['definition'].replace('\\n','\n')}
        bucket=word[0].lower() if word and word[0].lower() in 'abcdefghijklmnopqrstuvwxyz' else '_'
        buckets.setdefault(bucket,[]).append(item)
        level_tags=row['tag'].split(); membership=[key for key,(_,tag) in tags.items() if (row['oxford']=='1' if key=='core' else tag in level_tags)]
        identity=word.lower()
        if not membership or not meaning or not re.fullmatch(r'[A-Za-z]+(?:[-\'][A-Za-z]+)*',word) or identity in seen: continue
        seen.add(identity)
        rank=int(row['bnc']) if row['bnc'].isdigit() and int(row['bnc'])>0 else 999999
        learning.append({'id':'ecdict:'+identity,'word':word,'meaning':meaning,'ipa':row['phonetic'],'pos':row['pos'],'deck':membership[0],'decks':membership,'exchange':row['exchange'],'example':'','translation':'','audio':[],'rank':rank,'source':'ecdict'})
dictionary=out/'dictionary';dictionary.mkdir(exist_ok=True)
for key,values in buckets.items():
    values.sort(key=lambda n:n['word'].lower())
    (dictionary/(key+'.json')).write_text(json.dumps(values,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
learning.sort(key=lambda w:(w['rank'],w['word']))
decks=[{'id':key,'name':name,'label':key.upper(),'count':sum(key in w['decks'] for w in learning)} for key,(name,_) in tags.items()]
(out/'learning.json').write_text(json.dumps({'words':learning,'decks':decks},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
report={'repository':'https://github.com/skywind3000/ECDICT','revision':revision,'license':'MIT','gitBlobSha1':blob,'sourceSha256':hashlib.sha256(source).hexdigest(),'sourceBytes':len(source),'csvRows':total,'dictionaryRows':sum(map(len,buckets.values())),'malformedRows':malformed,'emptyTranslationRows':missing,'learningWords':len(learning),'decks':decks,'reviewStatus':'imported-not-independently-reviewed','audio':'device-speech-not-human-recordings','examples':'source dictionary has no complete example dataset'}
for target in [vendor/'SOURCE.json',out/'import-report.json']:
    target.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
