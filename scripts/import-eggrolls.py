"""Download a pinned upstream snapshot, preserve all source media and normalize notes.
No upstream code or card template is executed.
"""
import argparse, csv, hashlib, html, io, json, re, shutil, sys, time, urllib.request, zipfile, zlib
from collections import Counter
from pathlib import Path, PurePosixPath

REVISION='853798a4dec3630cad1984aa1c7edab31b09d109'
NOTES_BLOB='d27e877700b46559199f49cfbf3fbbec50c54a94'
EXPECTED_MEDIA_COUNT=27063
EXPECTED_MEDIA_BYTES=397838177
REPO='https://github.com/5mdld/anki-jlpt-decks'
FIELDS=['Notetype','Deck','NoteID','VocabKanji','VocabPitch','VocabPoS','VocabFurigana','VocabDefSC','VocabDefTC','VocabPlus','VocabAudio']
for i in range(1,5):
    FIELDS += [f'SentType{i}',f'SentKanji{i}',f'SentFurigana{i}',f'SentDefSC{i}',f'SentDefTC{i}',f'SentAudio{i}']
FIELDS += ['Sort','Alt1','Alt2','Tags']

def dump(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def plain(value):
    value=re.sub(r'<br\s*/?>','\n',value,flags=re.I)
    value=re.sub(r'<[^>]+>','',value)
    return html.unescape(value).strip()

def ruby_text(value):
    value=re.sub(r'<rt\b[^>]*>.*?</rt>','',value,flags=re.S|re.I)
    value=re.sub(r'<rp\b[^>]*>.*?</rp>','',value,flags=re.S|re.I)
    return plain(value)

def sound_refs(value):
    return list(dict.fromkeys(re.findall(r'\[sound:([^\]]+)\]',value)))

def download(archive):
    if archive.exists() and zipfile.is_zipfile(archive):
        print('Reusing downloaded pinned snapshot.',flush=True);return
    url=f'https://codeload.github.com/5mdld/anki-jlpt-decks/zip/{REVISION}'
    print('Downloading pinned upstream snapshot...',flush=True)
    req=urllib.request.Request(url,headers={'User-Agent':'Shici-personal-learning-importer/1.0'})
    task_partial=archive.with_suffix('.part')
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=90) as resp,task_partial.open('wb') as out:
                size=0;reported=0
                while True:
                    block=resp.read(1024*1024)
                    if not block:break
                    out.write(block);size+=len(block)
                    if size-reported>=25*1024*1024:
                        print(f'Downloaded {size//(1024*1024)} MiB.',flush=True);reported=size
            if not zipfile.is_zipfile(task_partial):raise ValueError('Snapshot is not a ZIP archive')
            task_partial.replace(archive);return
        except Exception as e:
            print(f'Download attempt {attempt+1} failed: {type(e).__name__}.',flush=True)
            if attempt==2:raise
            time.sleep(2)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--project',required=True);parser.add_argument('--work',required=True)
    args=parser.parse_args();project=Path(args.project).resolve();work=Path(args.work).resolve();work.mkdir(parents=True,exist_ok=True)
    archive=work/f'eggrolls-{REVISION}.zip';download(archive)
    vendor=project/'data/vendor/eggrolls';media=vendor/'media';media.mkdir(parents=True,exist_ok=True)
    inventory=[];notes=None
    with zipfile.ZipFile(archive) as z:
        for info in z.infolist():
            parts=PurePosixPath(info.filename).parts
            if '..' in parts or info.is_dir():continue
            if len(parts)>=4 and parts[1:3]==('deck-source','medias'):
                name='/'.join(parts[3:]);target=(media/name).resolve()
                if not target.is_relative_to(media.resolve()):raise ValueError('Unsafe upstream media path')
                target.parent.mkdir(parents=True,exist_ok=True)
                if not target.exists() or target.stat().st_size!=info.file_size or zlib.crc32(target.read_bytes())!=info.CRC:
                    with z.open(info) as source,target.open('wb') as dest:shutil.copyfileobj(source,dest)
                inventory.append({'file':name,'bytes':info.file_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
            elif len(parts)==3 and parts[1:]==('deck-source','notes.csv'):
                notes=z.read(info);(vendor/'notes.csv').write_bytes(notes)
            elif len(parts)==2 and parts[1] in ['README.md','LICENSE']:
                (vendor/parts[1]).write_bytes(z.read(info))
    if notes is None:raise ValueError('notes.csv missing')
    blob=hashlib.sha1(b'blob '+str(len(notes)).encode()+b'\0'+notes).hexdigest()
    if blob!=NOTES_BLOB:raise ValueError('Upstream notes blob checksum mismatch')
    total=sum(x['bytes'] for x in inventory)
    if len(inventory)!=EXPECTED_MEDIA_COUNT or total!=EXPECTED_MEDIA_BYTES:raise ValueError('Media snapshot incomplete')
    dump(vendor/'media-manifest.json',inventory)
    print(f'Preserved {len(inventory)} media files ({total} bytes) and verified notes blob.',flush=True)
    text=notes.decode('utf-8-sig');lines=text.splitlines();print('CSV preamble: '+repr(lines[:5])[:900],flush=True)
    # Anki export header directives occur before the tab-separated note data.
    first_data=0
    while first_data<len(lines) and lines[first_data].startswith('#'):first_data+=1
    content='\n'.join(lines[first_data:])
    dialect=csv.excel_tab if '\t' in content.splitlines()[0] else csv.excel
    rows=list(csv.reader(io.StringIO(content),dialect=dialect))
    print('Rows / field counts: '+str(len(rows))+' / '+str(Counter(map(len,rows))),flush=True)
    if len(rows[0]) not in (len(FIELDS),len(FIELDS)-1,len(FIELDS)+1):
        raise ValueError('Unknown CSV schema; inspect before importing')
    records=[];missing=[];by_level=Counter();media_names={x['file'] for x in inventory};seen=set()
    for rownum,row in enumerate(rows,1):
        if len(row)==len(FIELDS):raw=dict(zip(FIELDS,row))
        elif len(row)==len(FIELDS)-1:raw={'Notetype':'',**dict(zip(FIELDS[1:],row))}
        elif len(row)==len(FIELDS)+1:raw=dict(zip(FIELDS,row[1:]))
        else:raise ValueError(f'Unknown row shape at row {rownum}')
        upstream_id=raw['NoteID'].strip()
        if not upstream_id or upstream_id in seen:raise ValueError(f'Invalid/duplicate NoteID at row {rownum}')
        seen.add(upstream_id)
        level_match=re.search(r'(?<![A-Za-z0-9])N[1-5]',raw['Deck']+' '+raw['Tags'])
        level=level_match.group(0) if level_match else 'unclassified';by_level[level]+=1
        refs=sound_refs(raw['VocabAudio']);sentences=[]
        for i in range(1,5):
            entry={'type':plain(raw[f'SentType{i}']),'text':ruby_text(raw[f'SentKanji{i}']),'furiganaMarkup':raw[f'SentFurigana{i}'],'translationSC':plain(raw[f'SentDefSC{i}']),'translationTC':plain(raw[f'SentDefTC{i}']),'audio':sound_refs(raw[f'SentAudio{i}'])}
            if any(raw[f'{k}{i}'] for k in ['SentType','SentKanji','SentFurigana','SentDefSC','SentDefTC','SentAudio']):sentences.append(entry)
            refs.extend(entry['audio'])
        missing.extend({'noteId':upstream_id,'file':ref} for ref in set(refs) if ref not in media_names)
        records.append({'id':f'eggrolls:{upstream_id}','sourceNoteId':upstream_id,'level':level,'deck':raw['Deck'],'word':ruby_text(raw['VocabKanji']),'furiganaMarkup':raw['VocabFurigana'],'pitch':plain(raw['VocabPitch']),'pos':plain(raw['VocabPoS']),'meaningSC':plain(raw['VocabDefSC']),'meaningTC':plain(raw['VocabDefTC']),'extra':plain(raw['VocabPlus']),'wordAudio':sound_refs(raw['VocabAudio']),'sentences':sentences,'sort':raw['Sort'],'tags':raw['Tags'].split(),'source':{'author':'egg rolls','repository':REPO,'revision':REVISION,'license':'CC-BY-NC-4.0','reviewStatus':'imported-not-independently-reviewed'},'raw':raw})
    generated=project/'data/japanese';generated.mkdir(parents=True,exist_ok=True)
    dump(generated/'all-notes.json',records)
    for level in ['N1','N2','N3','N4','N5','unclassified']:
        subset=[r for r in records if r['level']==level]
        if subset:dump(generated/f'{level}.json',subset)
    report={'repository':REPO,'revision':REVISION,'notesBlobSha1':blob,'license':'CC-BY-NC-4.0','notes':len(records),'levels':dict(sorted(by_level.items())),'mediaFiles':len(inventory),'mediaBytes':total,'audioFiles':sum(x['file'].lower().endswith(('.mp3','.ogg','.wav','.m4a')) for x in inventory),'missingMediaReferences':missing,'notesWithoutWord':sum(not r['word'] for r in records),'notesWithoutSCMeaning':sum(not r['meaningSC'] for r in records),'notesWithoutSentences':sum(not r['sentences'] for r in records),'independentLanguageReview':False,'modified':'Converted CSV to app JSON; retained original fields; upstream content not independently corrected.','generatedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
    dump(generated/'import-report.json',report);dump(vendor/'SOURCE.json',report)
    print(json.dumps({k:v for k,v in report.items() if k!='missingMediaReferences'},ensure_ascii=False),flush=True)
    print(f'Missing media references: {len(missing)}',flush=True)

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
