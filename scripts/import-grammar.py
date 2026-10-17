"""Import pinned, attributed grammar sources without executing upstream code.
Requires Python 3.9+ and lxml. Network is used only to fetch the source files.
"""
import argparse, copy, hashlib, html, json, re, sys, time, urllib.parse, urllib.request, zipfile
from collections import Counter
from pathlib import Path, PurePosixPath
from lxml import html as lhtml

SOURCES={
 'taekim':{'repo':'ShenHongFei/jp-grammar-guide','revision':'4df92cfbf0bd7b6ed73e3af913951dfe6e58278f','license':'CC-BY-NC-SA-3.0-US','author':'Tae Kim','translator':'pizzamx / wokanxing.info','origin':'https://res.wokanxing.info/jpgramma/index.html'},
 'jld':{'repo':'jkindrix/japanese-language-data','revision':'04014e06019fc9d4af76e6dbb64ec709fe863c4d','license':'CC-BY-SA-4.0','author':'Justin Kindrix and contributors'}
}
ALLOWED={'p','h2','h3','h4','h5','h6','ol','ul','li','dl','dt','dd','table','thead','tbody','tfoot','tr','td','th','em','strong','b','i','u','s','small','sup','sub','code','pre','blockquote','br','hr','ruby','rt','rp','span','div','a','details','summary'}
DISCARD={'script','style','nav','button','input','form','iframe','object','embed','audio','video','source','select','textarea','noscript'}

def dump(path,data):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def fetch(url,path):
 if path.exists():return path.read_bytes()
 path.parent.mkdir(parents=True,exist_ok=True)
 request=urllib.request.Request(url,headers={'User-Agent':'Shici-grammar-import/1.0'})
 with urllib.request.urlopen(request,timeout=90) as response:content=response.read()
 path.write_bytes(content);return content

def check(data,entry):
 digest=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
 if digest!=entry['sha']:raise ValueError('Source checksum mismatch: '+entry['path'])

def sanitized_body(container,pages,missing_assets):
 def safe_url(value):
  url=urllib.parse.urlsplit(value)
  if url.scheme in ('http','https'):return value
  if not url.scheme and not url.netloc:
   if not url.path:return '#'+urllib.parse.quote(url.fragment) if url.fragment else None
   filename=PurePosixPath(url.path).name
   if filename in pages:return './grammar.html?guide='+urllib.parse.quote(filename[:-5])+('#'+urllib.parse.quote(url.fragment) if url.fragment else '')
  return None
 def render(node):
  if not isinstance(node.tag,str):return ''
  tag=node.tag.lower()
  if tag in DISCARD:return ''
  if tag=='a' and re.match(r'(?:flip|toggle|toggleAll|toggleSpoilers)\(',node.get('onclick','')):
   return ''
  if tag=='img':
   src=node.get('src','');missing_assets.add(src)
   if not src or src.endswith('/play.png'):return ''
   return '<span class="missing-illustration">'+html.escape(node.get('alt') or '原资料插图（本仓库未提供完整插图素材）')+'</span>'
  inside=html.escape(node.text or '')+''.join(render(c)+html.escape(c.tail or '') for c in node)
  if tag not in ALLOWED:return inside
  attrs=[]
  for key in ('id','title','colspan','rowspan','lang','start'):
   value=node.get(key)
   if value and len(value)<400:attrs.append(f'{key}="{html.escape(value,quote=True)}"')
  if tag=='a':
   href=safe_url(node.get('href',''))
   if not href:return inside
   attrs.append('href="'+html.escape(href,quote=True)+'"')
   if href.startswith(('https:','http:')):attrs+=['target="_blank"','rel="noopener noreferrer"']
  if any(c in (node.get('class') or '').split() for c in ('hidex','spoiler')):
   reveal='<details class="guide-answer"><summary>查看原资料答案</summary><div>'+inside+'</div></details>'
   return '<td>'+reveal+'</td>' if tag=='td' else reveal
  attribute=(' '+' '.join(attrs)) if attrs else ''
  if tag in ('br','hr'):return '<'+tag+attribute+'>'
  return '<'+tag+attribute+'>'+inside+'</'+tag+'>'
 return ''.join(render(c)+html.escape(c.tail or '') for c in container)

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--project',required=True);parser.add_argument('--work',required=True);args=parser.parse_args()
 project=Path(args.project).resolve();work=Path(args.work).resolve();work.mkdir(parents=True,exist_ok=True)
 lock=json.loads((Path(__file__).parent/'grammar-source-lock.json').read_text(encoding='utf-8'))
 lock={s['repository']:{f['path']:f for f in s['files']} for s in lock}
 vendor=project/'data/vendor';out=project/'data/grammar';out.mkdir(parents=True,exist_ok=True)
 spec=SOURCES['taekim'];repo=spec['repo'];revision=spec['revision'];raw=vendor/'taekim';raw.mkdir(parents=True,exist_ok=True)
 archive=work/'taekim.zip';fetch(f'https://codeload.github.com/{repo}/zip/{revision}',archive)
 page_bytes={};inventory=[]
 with zipfile.ZipFile(archive) as z:
  for item in z.infolist():
   parts=PurePosixPath(item.filename).parts
   if item.is_dir() or len(parts)!=2:continue
   name=parts[1]
   if not(name.endswith('.html') or name in ('README.md','LICENSE')):continue
   data=z.read(item);check(data,lock[repo][name]);(raw/name).write_bytes(data)
   inventory.append({'file':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
   if name.endswith('.html'):page_bytes[name]=data
 index=lhtml.fromstring(page_bytes['index.html'])
 toc=index.xpath("//h2[normalize-space(.)='目录']/following-sibling::ol[1]")[0]
 selections=[];seen=set()
 for item in toc.xpath('./li'):
  links=item.xpath('./a');group=links[0].text_content().strip() if links else '其他'
  for link in item.xpath('.//a'):
   filename=urllib.parse.urlsplit(link.get('href','')).path
   if filename.endswith('.html') and filename not in seen:
    selections.append((filename,group));seen.add(filename)
 records=[];missing=[];missing_assets=set()
 for order,(filename,group) in enumerate(selections):
  if filename not in page_bytes:missing.append(filename);continue
  doc=lhtml.fromstring(page_bytes[filename]);titles=doc.xpath("//*[@id='page-title']")
  if not titles:raise ValueError('Missing real content title: '+filename)
  title=titles[0].text_content().strip();container=copy.deepcopy(titles[0].getparent())
  for header in container.xpath(".//*[@id='page-title']"):header.drop_tree()
  body=sanitized_body(container,seen,missing_assets)
  search_text=lhtml.fromstring('<div>'+body+'</div>').text_content()
  records.append({'id':'taekim:'+filename[:-5],'slug':filename[:-5],'title':title,'group':group,'order':order,'kind':'exercise' if filename.endswith('_ex.html') else 'chapter','contentHtml':body,'searchText':re.sub(r'\s+',' ',search_text).strip(),'source':{**spec,'repository':'https://github.com/'+repo,'file':filename,'sourceUrl':f'https://github.com/{repo}/blob/{revision}/{filename}','reviewStatus':'imported-not-independently-reviewed'}})
 if missing:raise ValueError('Missing linked guide chapters: '+repr(missing))
 dump(out/'taekim-guide.json',records);dump(raw/'media-and-source-manifest.json',inventory)
 dump(raw/'SOURCE.json',{**spec,'changes':'Extracted linked Chinese guide chapters; removed upstream executable code/navigation/styles; adapted internal links and collapsible answers. Content derivatives remain CC-BY-NC-SA-3.0-US. Root BSD LICENSE is retained separately and does not override the guide content license.'})
 (raw/'CONTENT-LICENSE.txt').write_text('Chinese translation of Tae Kim Japanese Grammar Guide\nAuthor: Tae Kim\nTranslator: pizzamx / wokanxing.info\nGitHub mirror: '+repo+'\nLicense: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 United States\nhttps://creativecommons.org/licenses/by-nc-sa/3.0/us/\nVerified translator licensing statement: https://res.wokanxing.info/jpgramma/index.html\nThe README and index.html preserve the original content license statement. Adapted guide content in this application is distributed under the same license.\n',encoding='utf-8')
 print('Imported Chinese guide chapters: '+str(len(records)),flush=True)

 spec=SOURCES['jld'];repo=spec['repo'];revision=spec['revision'];raw=vendor/'jld-grammar';raw.mkdir(parents=True,exist_ok=True)
 records=[]
 for name in ['README.md','LICENSE','ATTRIBUTION.md']+[f'grammar-curated/n{i}.json' for i in range(1,6)]:
  target=raw/name;data=fetch(f'https://raw.githubusercontent.com/{repo}/{revision}/{name}',work/'jld'/name);check(data,lock[repo][name]);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
  if name.endswith('.json'):
   source=json.loads(data)
   for entry in source:
    if entry['level']!='N'+name[-6]:raise ValueError('Grammar level mismatch')
    records.append({'id':'jld:'+entry['id'],'sourceId':entry['id'],'level':entry['level'],'pattern':entry['pattern'],'meaningEnglish':entry['meaning_en'],'explanationEnglish':entry.get('meaning_detailed',''),'formation':entry.get('formation',''),'formationNotes':entry.get('formation_notes',[]),'formality':entry.get('formality',''),'examples':entry.get('examples',[]),'relatedIds':['jld:'+x for x in entry.get('related',[])],'reviewStatus':entry.get('review_status','draft'),'source':{**spec,'repository':'https://github.com/'+repo,'file':name,'sourceUrl':f'https://github.com/{repo}/blob/{revision}/{name}','language':'en','changes':'Namespaced IDs and app field mapping; original JSON preserved; no language review or Chinese translation added.'},'raw':entry})
 ids={r['id'] for r in records}
 if len(ids)!=len(records):raise ValueError('Duplicate grammar IDs')
 counts=dict(sorted(Counter(r['level'] for r in records).items()))
 dump(out/'jld-all.json',records)
 for level in counts:dump(out/f'jld-{level}.json',[r for r in records if r['level']==level])
 dump(raw/'SOURCE.json',{**spec,'changes':'Only original grammar-curated files imported. Aggregate dictionary/corpus/conjugation files not imported. Direct derivatives of this grammar dataset remain CC-BY-SA-4.0.'})
 report={'sources':SOURCES,'guideChapters':len(selections),'guideExercises':sum(r['kind']=='exercise' for r in json.loads((out/'taekim-guide.json').read_text(encoding='utf-8'))),'grammarPoints':len(records),'grammarLevels':counts,'reviewStatusCounts':dict(Counter(r['reviewStatus'] for r in records)),'missingGuideChapters':missing,'unresolvedRelatedIds':sorted({x for r in records for x in r['relatedIds'] if x not in ids}),'guideReferencedImagesNotIncluded':sorted(missing_assets),'independentLanguageReview':False,'chineseTranslationAddedToJLD':False,'generatedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
 dump(out/'import-report.json',report);print(json.dumps(report,ensure_ascii=False),flush=True)

if __name__=='__main__':
 sys.stdout.reconfigure(encoding='utf-8');main()
