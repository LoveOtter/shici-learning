import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,rateWord,recordAnswer,studyQueue,validateState,dayKey} from '../src/model.js';
import {words,lessons,questions} from '../src/data.js';
const now=new Date('2026-10-02T10:00:00Z');
test('fresh learner has ten new words; ratings schedule FSRS reviews and count unique new words',()=>{
 let s=emptyState();assert.equal(studyQueue(s,now).length,10);
 s=rateWord(s,'habit',1,now);assert.ok(s.cards.habit.due>now);assert.equal(s.cards.habit.reps,1);
 s=rateWord(s,'habit',3,new Date(now.getTime()+60000));assert.equal(s.cards.habit.reps,2);assert.equal(s.days[dayKey(now)].new.length,1);
 assert.equal(studyQueue(s,now).filter(id=>!s.cards[id]).length,9);
 assert.ok(studyQueue(s,new Date('2026-10-10T10:00:00Z')).includes('habit'));
});
test('daily goal applies across decks while due reviews remain prioritized',()=>{
 let s=emptyState();s.goal=5;for(const id of ['habit','practice','improve','remember','forget'])s=rateWord(s,id,1,now);
 s.deck='travel';assert.equal(studyQueue(s,now).length,0);
 const due=studyQueue(s,new Date(now.getTime()+600000));assert.equal(due.length,5);
 const nextDay=studyQueue(s,new Date('2026-10-03T10:00:00Z'));assert.equal(nextDay.filter(id=>!s.cards[id]).length,5);
});
test('wrong answer persists, duplicate wrong answer stays unique, correcting it removes it',()=>{
 let s=emptyState();const q=questions[0];s=recordAnswer(s,q.id,(q.answer+1)%4,now).state;
 s=recordAnswer(s,q.id,(q.answer+1)%4,now).state;assert.deepEqual(s.wrong,[q.id]);
 s=recordAnswer(s,q.id,q.answer,now).state;assert.equal(s.wrong.length,0);assert.equal(s.days[dayKey(now)].answers,3);assert.equal(s.days[dayKey(now)].correct,1);
});
test('backup roundtrip retains scheduling, answers and curriculum; rejects corrupt or foreign input',()=>{
 let s=rateWord(emptyState(),'habit',4,now);s=recordAnswer(s,questions[0].id,0,now).state;s.completed=['present'];
 const backup=validateState(JSON.parse(JSON.stringify(s)));assert.equal(backup.cards.habit.due.getTime(),s.cards.habit.due.getTime());assert.deepEqual(backup.completed,['present']);
 assert.throws(()=>validateState({...s,goal:100}));assert.throws(()=>validateState({...s,wrong:['foreign-id']}));
 const bad=structuredClone(s);bad.cards.habit.stability=NaN;assert.throws(()=>validateState(bad));
 assert.throws(()=>recordAnswer(s,'present-0',99));assert.throws(()=>rateWord(s,'foreign',2));
});
test('curriculum has unique question IDs, valid answers and nonduplicate options',()=>{
 assert.equal(words.length,60);assert.equal(lessons.length,8);assert.equal(questions.length,100);
 assert.equal(new Set(questions.map(q=>q.id)).size,100);
 for(const q of questions){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options[q.answer]);assert.ok(q.explanation);}
});
