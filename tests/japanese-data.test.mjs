import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {loadJapaneseLevel,findJapaneseNotes,mediaUrl,normalizeJapaneseNote,JAPANESE_SOURCE} from '../src/japanese-data.js';
import {ankiFuriganaText} from '../src/japanese-furigana.js';
const root=new URL('../data/',import.meta.url);
const report=JSON.parse(await readFile(new URL('japanese/import-report.json',root),'utf8'));
const all=JSON.parse(await readFile(new URL('japanese/all-notes.json',root),'utf8'));
test('complete pinned upstream snapshot preserved without duplicate notes or missing fields',()=>{
 assert.equal(all.length,10641);assert.equal(new Set(all.map(n=>n.id)).size,10641);
 assert.equal(report.revision,JAPANESE_SOURCE.revision);assert.equal(report.mediaFiles,27063);assert.equal(report.audioFiles,27060);
 assert.deepEqual(report.missingMediaReferences,[]);assert.equal(report.notesWithoutWord,0);assert.equal(report.notesWithoutSCMeaning,0);
 for(const n of all){assert.equal(n.source.license,'CC-BY-NC-4.0');assert.equal(n.source.reviewStatus,'imported-not-independently-reviewed');assert.equal(Object.keys(n.raw).length,39);assert.ok(n.id.endsWith(n.raw.NoteID));}
});
test('level packs cover every imported record exactly once',async()=>{
 const counts={N5:807,N4:757,N3:1817,N2:3215,N1:4045},seen=new Set();
 for(const [level,count]of Object.entries(counts)){
  const notes=await loadJapaneseLevel(level,{fetchImpl:async()=>({ok:true,json:async()=>JSON.parse(await readFile(new URL(`japanese/${level}.json`,root),'utf8'))})});
  assert.equal(notes.length,count);for(const n of notes){assert.equal(n.level,level);assert.ok(!seen.has(n.id));seen.add(n.id);}
  for(let i=1;i<notes.length;i++)assert.ok(Number(notes[i-1].sort)<=Number(notes[i].sort),'preserve upstream learning order');
 }
 assert.equal(seen.size,all.length);
});
test('all referenced audio files exist; encoded URLs preserve filenames',async()=>{
 const refs=new Set(all.flatMap(n=>[...n.wordAudio,...n.sentences.flatMap(s=>s.audio)]));
 const checks=await Promise.all([...refs].map(async file=>{const url=mediaUrl(file);assert.equal(decodeURIComponent(url.split('/').pop()),file);const s=await stat(new URL(`vendor/eggrolls/media/${encodeURIComponent(file)}`,root));assert.ok(s.size>0);}));
 assert.ok(checks.length>20000);assert.throws(()=>mediaUrl('../outside.mp3'));assert.throws(()=>mediaUrl('x/y.mp3'));
});
test('Japanese and Chinese searches return the expected item, malformed data fails safely',async()=>{
 assert.equal(ankiFuriganaText('ご 飯[はん]を 食[た]べる'),'ご<ruby>飯<rt>はん</rt></ruby>を<ruby>食<rt>た</rt></ruby>べる');
 assert.equal(ankiFuriganaText('高校[こうこう]'),'<ruby>高校<rt>こうこう</rt></ruby>');
 assert.equal(ankiFuriganaText('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
 const sample=all.find(n=>n.level==='N5');assert.ok(findJapaneseNotes([sample],sample.word).length);assert.ok(findJapaneseNotes([sample],sample.meaningSC.slice(0,2)).length);
 assert.throws(()=>normalizeJapaneseNote({id:'bad'}));await assert.rejects(()=>loadJapaneseLevel('N0'));
 await assert.rejects(()=>loadJapaneseLevel('N5',{fetchImpl:async()=>({ok:false,status:404})}));
});
