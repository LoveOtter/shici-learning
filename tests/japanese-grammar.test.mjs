import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadGrammar,findGrammar,GRAMMAR_SOURCES} from '../src/japanese-grammar-data.js';
const root=new URL('../data/',import.meta.url);
const json=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const guide=await json('grammar/taekim-guide.json'),all=await json('grammar/jld-all.json');
const localFetch=async path=>({ok:true,json:()=>json(path.replace('./data/',''))});
test('all licensed guide chapters and original grammar points retained with provenance',async()=>{
 assert.equal(guide.length,70);assert.equal(new Set(guide.map(x=>x.id)).size,70);assert.equal(guide.filter(x=>x.kind==='exercise').length,8);
 assert.equal(all.length,595);const ids=new Set(all.map(x=>x.id));assert.equal(ids.size,595);
 for(const n of all){assert.equal(n.source.license,'CC-BY-SA-4.0');assert.equal(n.reviewStatus,'draft');assert.equal(n.raw.id,n.sourceId);assert.equal(n.source.revision,GRAMMAR_SOURCES.jld.revision);for(const id of n.relatedIds)assert.ok(ids.has(id));}
 for(const n of guide){assert.equal(n.source.license,'CC-BY-NC-SA-3.0-US');assert.ok(n.contentHtml.length>0);assert.equal(n.source.reviewStatus,'imported-not-independently-reviewed');}
 const counts={N5:77,N4:89,N3:130,N2:149,N1:150};const seen=new Set();
 for(const [level,count] of Object.entries(counts)){const notes=await loadGrammar('jld',{level,fetchImpl:localFetch});assert.equal(notes.length,count);for(const n of notes){assert.ok(!seen.has(n.id));seen.add(n.id);}}
 assert.equal(seen.size,595);assert.deepEqual(await loadGrammar('taekim',{fetchImpl:localFetch}),guide);
});
test('source bytes match locked upstream blobs, both licenses stay separate',async()=>{
 const locks=JSON.parse(await readFile(new URL('../scripts/grammar-source-lock.json',import.meta.url),'utf8'));
 for(const source of locks){const folder=source.repository.startsWith('Shen')?'taekim':'jld-grammar';for(const entry of source.files){const bytes=await readFile(new URL(`vendor/${folder}/${entry.path}`,root));const hash=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');assert.equal(hash,entry.sha,entry.path);}}
 const contentLicense=await readFile(new URL('vendor/taekim/CONTENT-LICENSE.txt',root),'utf8');assert.ok(contentLicense.includes('ShareAlike'));assert.ok(contentLicense.includes('pizzamx'));
});
test('guide rendering removes executable source code and preserves navigation and answer reveals',()=>{
 const slugs=new Set(guide.map(n=>n.slug));let answerReveals=0;
 for(const n of guide){const text=n.contentHtml;assert.ok(!/<(?:script|iframe|object|embed|form|input|button|style)\b/i.test(text));assert.ok(!/\s(?:on\w+|style)\s*=/i.test(text));assert.ok(!/(?:href|src)=["']\s*(?:javascript|data):/i.test(text));for(const match of text.matchAll(/grammar\.html\?guide=([^"#]+)/g))assert.ok(slugs.has(decodeURIComponent(match[1])));answerReveals+=(text.match(/class="guide-answer"/g)||[]).length;}
 assert.ok(answerReveals>20);assert.ok(guide.find(n=>n.slug==='stateofbeing').searchText.includes('状态'));
 assert.match(guide.find(n=>n.slug==='stateofbeing_ex').contentHtml,/<td><details class="guide-answer">/,'table answers must stay collapsed too');
});
test('Chinese and Japanese searches work; invalid sources, revisions and failed fetches are rejected',async()=>{
 assert.ok(findGrammar(guide,'形容词').length>0);assert.ok(findGrammar(all,'です').some(n=>n.sourceId==='desu-polite-copula'));assert.ok(findGrammar(guide,'','基本语法').every(n=>n.group==='基本语法'));
 await assert.rejects(()=>loadGrammar('unknown'));await assert.rejects(()=>loadGrammar('jld',{level:'N0'}));
 await assert.rejects(()=>loadGrammar('taekim',{fetchImpl:async()=>({ok:false,status:404})}));
 await assert.rejects(()=>loadGrammar('taekim',{fetchImpl:async()=>({ok:true,json:async()=>[{...guide[0],source:{revision:'old'}}]})}));
});
