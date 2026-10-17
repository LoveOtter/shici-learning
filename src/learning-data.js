import {words as starterWords,decks as starterDecks,lessons as starterLessons} from './data.js';
import {englishExtraLessons,japaneseLessons} from './extra-lessons.js';
export function shortMeaning(value){return String(value||'').replace(/\\n/g,'\n').split('\n').find(s=>s.trim())?.trim().slice(0,80)||'暂无释义';}
export function makeQuestions(words,lessons){
 const unique=[...new Set(words.map(w=>shortMeaning(w.meaning)))];
 const wordQuestions=words.map((w,index)=>{
  const correct=shortMeaning(w.meaning),choices=[];let cursor=(index*13+7)%unique.length;
  while(choices.length<3&&choices.length<unique.length-1){const value=unique[cursor++%unique.length];if(value!==correct&&!choices.includes(value))choices.push(value);}
  if(choices.length<3)return null;
  const answer=index%4;choices.splice(answer,0,correct);
  return {id:`word-${w.id}`,kind:'word',word:w.id,deck:w.deck,decks:w.decks||[w.deck],prompt:`“${w.word}” 的主要释义是？`,options:choices,answer,explanation:`${w.word}：${w.meaning}${w.example?'。例句：'+w.example+'（'+w.translation+'）':''}`};
 }).filter(Boolean);
 const grammarQuestions=lessons.flatMap(l=>l.questions.map(([prompt,options,answer,explanation],i)=>({id:`${l.id}-${i}`,kind:'grammar',lesson:l.id,prompt,options,answer,explanation})));
 return {wordQuestions,grammarQuestions,questions:[...grammarQuestions,...wordQuestions]};
}
export async function loadLearningData(language,{fetchImpl=globalThis.fetch}={}){
 if(!['en','ja'].includes(language))throw Error('请选择英语或日语。');
 const url=language==='en'?'./data/english/learning.json':'./data/learning/japanese.json';
 const response=await fetchImpl(url);if(!response.ok)throw Error('学习资料未能加载，请检查网络连接后重试。');
 const data=await response.json();let words,decks,lessons;
 if(language==='en'){
  const original=new Set(starterWords.map(w=>w.word.toLowerCase()));
  const dictionaryWords=new Map(data.words.map(w=>[w.word.toLowerCase(),w]));
  words=[...starterWords.map(w=>({...w,decks:[w.deck,...(dictionaryWords.get(w.word.toLowerCase())?.decks||[])],audio:[],source:'original'})),...data.words.filter(w=>!original.has(w.word.toLowerCase()))];
  decks=[...starterDecks,...data.decks.map(d=>({...d,count:words.filter(w=>(w.decks||[w.deck]).includes(d.id)).length}))];
  lessons=[...starterLessons,...englishExtraLessons];
 }else{words=data.words;decks=data.decks;lessons=japaneseLessons;}
 if(!Array.isArray(words)||words.length<4||new Set(words.map(w=>w.id)).size!==words.length)throw Error('学习资料格式错误。');
 return {language,words,decks,lessons,...makeQuestions(words,lessons)};
}
