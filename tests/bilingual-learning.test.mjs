import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadLearningData} from '../src/learning-data.js';
import {createLearningModel,dayKey} from '../src/learning-model.js';
import {emptyState as oldState,rateWord as oldRate,recordAnswer as oldAnswer} from '../src/model.js';
const fetchImpl=async url=>({ok:true,json:async()=>JSON.parse(await readFile(new URL('../'+url.replace(/^\.\//,''),import.meta.url),'utf8'))});
const en=await loadLearningData('en',{fetchImpl}),ja=await loadLearningData('ja',{fetchImpl});
const enModel=createLearningModel(en),jaModel=createLearningModel(ja),now=new Date('2026-10-03T10:00:00Z');
test('both languages cover imported data, authored courses and unique answerable exercises',()=>{
 assert.ok(en.words.length>7400);assert.equal(en.lessons.length,16);assert.equal(ja.words.length,10641);assert.equal(ja.lessons.length,8);
 for(const dataset of [en,ja]){
  assert.equal(new Set(dataset.words.map(w=>w.id)).size,dataset.words.length);
  assert.equal(new Set(dataset.questions.map(q=>q.id)).size,dataset.questions.length);
  for(const q of dataset.questions){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options[q.answer]);assert.ok(q.explanation);}
 }
});
test('language records are isolated; backup roundtrip and previous English records survive',()=>{
 let s=oldRate(oldState(),'habit',3,now);s=oldAnswer(s,'present-0',0,now).state;s.completed=['present'];
 const migrated=enModel.validateState(JSON.parse(JSON.stringify(s)));assert.equal(migrated.language,'en');assert.equal(migrated.cards.habit.reps,1);assert.deepEqual(migrated.wrong,['present-0']);
 assert.throws(()=>jaModel.validateState(migrated));
 const id=jaModel.studyQueue(jaModel.emptyState(),now)[0];let state=jaModel.rateWord(jaModel.emptyState(),id,3,now);state.favorites=[id];
 const restored=jaModel.validateState(JSON.parse(JSON.stringify(state)));assert.equal(restored.cards[id].due.getTime(),state.cards[id].due.getTime());assert.deepEqual(restored.favorites,[id]);assert.throws(()=>enModel.validateState(restored));
 const corrupt=structuredClone(state);corrupt.cards[id].difficulty=Infinity;assert.throws(()=>jaModel.validateState(corrupt));
});
test('new-word targets span overlapping books and reviews take priority; wrong answers can be corrected',()=>{
 for(const [data,model] of [[en,enModel],[ja,jaModel]]){
  let s=model.emptyState();s.goal=5;const ids=model.studyQueue(s,now);assert.equal(ids.length,5);
  for(const id of ids)s=model.rateWord(s,id,1,now);
  s.deck=data.decks.at(-1).id;assert.equal(model.studyQueue(s,now).length,0);assert.equal(model.studyQueue(s,new Date(now.getTime()+600000)).length,5);
  const q=data.grammarQuestions[0];s=model.recordAnswer(s,q.id,(q.answer+1)%4,now).state;assert.deepEqual(s.wrong,[q.id]);s=model.recordAnswer(s,q.id,q.answer,now).state;assert.equal(s.wrong.length,0);assert.equal(s.days[dayKey(now)].correct,1);
 }
});
test('ECDICT source remains complete and empty fields are reported without fabricated audio',async()=>{
 const report=JSON.parse(await readFile(new URL('../data/english/import-report.json',import.meta.url),'utf8'));
 assert.equal(report.csvRows,770611);assert.equal(report.dictionaryRows,770611);assert.equal(report.sourceBytes,65933428);assert.equal(report.malformedRows,0);assert.equal(report.emptyTranslationRows,1872);
 assert.ok(en.words.every(w=>w.audio.length===0));
});
