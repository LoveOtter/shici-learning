import {createEmptyCard,fsrs} from 'ts-fsrs';
export const dayKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const reviveCard=c=>({...c,due:new Date(c.due),...(c.last_review?{last_review:new Date(c.last_review)}:{})});
export function createLearningModel({language,words,lessons,questions,decks}){
 const wordMap=new Map(words.map(w=>[w.id,w])),questionMap=new Map(questions.map(q=>[q.id,q]));
 const lessonIds=new Set(lessons.map(l=>l.id)),deckIds=new Set(decks.map(d=>d.id));
 const scheduler=fsrs({request_retention:0.9,enable_fuzz:false});
 const emptyState=()=>({version:2,language,goal:10,deck:decks[0].id,cards:{},completed:[],wrong:[],favorites:[],days:{}});
 const daily=(s,now)=>s.days[dayKey(now)]??={words:[],new:[],answers:0,correct:0};
 function rateWord(state,id,rating,now=new Date()){
  if(!wordMap.has(id)||![1,2,3,4].includes(rating))throw Error('无效的复习记录');
  const next=structuredClone(state),isNew=!next.cards[id];
  next.cards[id]=scheduler.next(isNew?createEmptyCard(now):reviveCard(next.cards[id]),now,rating).card;
  const day=daily(next,now);if(!day.words.includes(id))day.words.push(id);if(isNew)day.new.push(id);return next;
 }
 function recordAnswer(state,id,index,now=new Date()){
  const q=questionMap.get(id);if(!q||!Number.isInteger(index)||index<0||index>=q.options.length)throw Error('无效答案');
  const next=structuredClone(state),correct=index===q.answer,day=daily(next,now);
  day.answers++;if(correct){day.correct++;next.wrong=next.wrong.filter(x=>x!==id);}else if(!next.wrong.includes(id))next.wrong.push(id);
  return {state:next,correct};
 }
 function studyQueue(state,now=new Date()){
  const due=Object.entries(state.cards).filter(([id,c])=>wordMap.has(id)&&new Date(c.due)<=now).sort((a,b)=>new Date(a[1].due)-new Date(b[1].due)).map(([id])=>id);
  const remaining=Math.max(0,state.goal-(state.days[dayKey(now)]?.new.length||0));
  return [...due,...words.filter(w=>(w.decks||[w.deck]).includes(state.deck)&&!state.cards[w.id]).slice(0,remaining).map(w=>w.id)];
 }
 function validateState(input){
  const fail=()=>{throw Error('备份语言或内容不匹配，或学习记录已损坏。');};
  let s=input;if(language==='en'&&s?.version===1&&s.language===undefined)s={...s,version:2,language:'en',favorites:[]};
  if(!s||s.version!==2||s.language!==language||![5,10,20].includes(s.goal)||!deckIds.has(s.deck)||!s.cards||typeof s.cards!=='object'||Array.isArray(s.cards)||!s.days||typeof s.days!=='object'||Array.isArray(s.days))fail();
  for(const [field,ids] of [['completed',lessonIds],['wrong',new Set(questionMap.keys())],['favorites',new Set(wordMap.keys())]])if(!Array.isArray(s[field])||s[field].length>100000||s[field].some(id=>!ids.has(id)))fail();
  const cards={};for(const [id,c] of Object.entries(s.cards)){
   if(!wordMap.has(id)||!c||!c.due||!Number.isFinite(new Date(c.due).getTime())||![0,1,2,3].includes(c.state))fail();
   for(const k of ['stability','difficulty','elapsed_days','scheduled_days','reps','lapses'])if(!Number.isFinite(c[k])||c[k]<0)fail();
   if(c.difficulty>10||c.stability>1e9||!Number.isSafeInteger(c.reps)||!Number.isSafeInteger(c.lapses)||c.last_review&&!Number.isFinite(new Date(c.last_review).getTime()))fail();
   cards[id]=reviveCard(c);
  }
  if(Object.keys(s.days).length>5000)fail();const days={};
  for(const [date,d] of Object.entries(s.days)){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!d||!Array.isArray(d.words)||!Array.isArray(d.new)||d.words.some(id=>!wordMap.has(id))||d.new.some(id=>!wordMap.has(id))||!Number.isSafeInteger(d.answers)||!Number.isSafeInteger(d.correct)||d.answers<0||d.correct<0||d.correct>d.answers)fail();
   days[date]={words:[...new Set(d.words)],new:[...new Set(d.new)],answers:d.answers,correct:d.correct};
  }
  return {...emptyState(),goal:s.goal,deck:s.deck,cards,completed:[...new Set(s.completed)],wrong:[...new Set(s.wrong)],favorites:[...new Set(s.favorites)],days};
 }
 return {scheduler,emptyState,rateWord,recordAnswer,studyQueue,validateState};
}
