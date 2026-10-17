import {createEmptyCard,fsrs} from 'ts-fsrs';
import {words,lessons,questions} from './data.js';
export const scheduler=fsrs({request_retention:0.9,enable_fuzz:false});
export const dayKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const emptyState=()=>({version:1,goal:10,deck:'daily',cards:{},completed:[],wrong:[],days:{}});
export const reviveCard=c=>({...c,due:new Date(c.due),...(c.last_review?{last_review:new Date(c.last_review)}:{})});
export function rateWord(state,id,rating,now=new Date()){
 if(!words.some(w=>w.id===id)||![1,2,3,4].includes(rating))throw Error('无效的复习记录');
 const next=structuredClone(state),isNew=!next.cards[id];
 next.cards[id]=scheduler.next(isNew?createEmptyCard(now):reviveCard(next.cards[id]),now,rating).card;
 const day=next.days[dayKey(now)]??={words:[],new:[],answers:0,correct:0};
 if(!day.words.includes(id))day.words.push(id);
 if(isNew)day.new.push(id);
 return next;
}
export function recordAnswer(state,id,index,now=new Date()){
 const q=questions.find(q=>q.id===id);if(!q||!Number.isInteger(index)||index<0||index>=q.options.length)throw Error('无效答案');
 const next=structuredClone(state),correct=index===q.answer;
 const day=next.days[dayKey(now)]??={words:[],new:[],answers:0,correct:0};
 day.answers++;if(correct){day.correct++;next.wrong=next.wrong.filter(x=>x!==id);}else if(!next.wrong.includes(id))next.wrong.push(id);
 return {state:next,correct};
}
export function studyQueue(state,now=new Date()){
 const due=words.filter(w=>state.cards[w.id]&&new Date(state.cards[w.id].due)<=now).sort((a,b)=>new Date(state.cards[a.id].due)-new Date(state.cards[b.id].due));
 const remaining=Math.max(0,state.goal-(state.days[dayKey(now)]?.new.length||0));
 const fresh=words.filter(w=>w.deck===state.deck&&!state.cards[w.id]).slice(0,remaining);
 return [...due,...fresh].map(w=>w.id);
}
export function validateState(s){
 const fail=()=>{throw Error('备份格式不正确，或包含不支持的学习记录。');};
 if(!s||s.version!==1||![5,10,20].includes(s.goal)||!['daily','travel','work'].includes(s.deck)||!s.cards||typeof s.cards!=='object'||Array.isArray(s.cards)||!s.days||typeof s.days!=='object'||Array.isArray(s.days))fail();
 const ids=new Set(words.map(w=>w.id)),qids=new Set(questions.map(q=>q.id)),lids=new Set(lessons.map(l=>l.id));
 if(!Array.isArray(s.completed)||!Array.isArray(s.wrong)||s.completed.some(x=>!lids.has(x))||s.wrong.some(x=>!qids.has(x)))fail();
 const cards={};
 for(const [id,c]of Object.entries(s.cards)){
  if(!ids.has(id)||!c||!Number.isFinite(new Date(c.due).getTime())||!c.due||![0,1,2,3].includes(c.state))fail();
  for(const k of ['stability','difficulty','elapsed_days','scheduled_days','reps','lapses'])if(!Number.isFinite(c[k])||c[k]<0)fail();
  if(c.difficulty>10||c.stability>1e9||!Number.isInteger(c.reps)||!Number.isInteger(c.lapses))fail();
  if(c.last_review&&!Number.isFinite(new Date(c.last_review).getTime()))fail();
  cards[id]=reviveCard(c);
 }
 if(Object.keys(s.days).length>5000)fail();
 const days={};for(const [date,d]of Object.entries(s.days)){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!d||!Array.isArray(d.words)||!Array.isArray(d.new)||d.words.some(id=>!ids.has(id))||d.new.some(id=>!ids.has(id))||!Number.isSafeInteger(d.answers)||!Number.isSafeInteger(d.correct)||d.answers<0||d.correct<0||d.correct>d.answers)fail();
  days[date]={words:[...new Set(d.words)],new:[...new Set(d.new)],answers:d.answers,correct:d.correct};
 }
 return{version:1,goal:s.goal,deck:s.deck,cards,completed:[...new Set(s.completed)],wrong:[...new Set(s.wrong)],days};
}
