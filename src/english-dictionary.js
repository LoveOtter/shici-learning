import {formatWordForms} from './word-forms.js';
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const form=document.getElementById('dictionary-form'),status=document.getElementById('dictionary-status'),results=document.getElementById('dictionary-results');
let generation=0,current=[],cache=new Map();
form.addEventListener('submit',async event=>{
 event.preventDefault();const token=++generation,query=document.getElementById('dictionary-query').value.trim().normalize('NFKC').toLowerCase();
 if(!/^[a-z][a-z '\-]*$/.test(query)){status.textContent='请输入英文单词或短语，例如 learn。';results.innerHTML='';return;}
 status.textContent='正在读取词典…';results.innerHTML='';
 try{const key=query[0];let rows=cache.get(key);if(!rows){const response=await fetch(`./data/english/dictionary/${key}.json`);if(!response.ok)throw Error('读取失败');rows=await response.json();cache.set(key,rows);if(cache.size>3)cache.delete(cache.keys().next().value);}
  if(token!==generation)return;
  const matches=rows.filter(w=>w.word.toLowerCase().startsWith(query));current=matches.slice(0,50);
  status.textContent=`找到 ${matches.length.toLocaleString()} 条记录${matches.length>50?'，显示前 50 条；请增加字母缩小范围。':'。'}`;
  results.innerHTML=current.map((w,i)=>`<article class="dictionary-row"><h2>${esc(w.word)}</h2><p class="muted">${esc(w.ipa)||'暂缺音标'}</p><p>${esc(w.meaning)||'原数据未提供中文释义。'}</p>${w.definition?`<details><summary>英文释义</summary><p>${esc(w.definition)}</p></details>`:''}${w.exchange?`<p class="muted">词形变化：${esc(formatWordForms(w.exchange))}</p>`:''}<button class="secondary" data-speak="${i}">设备英语朗读</button></article>`).join('');
 }catch{if(token===generation)status.textContent='词典未能加载，请确认电脑服务和局域网连接，再点击查询重试。';}
});
results.addEventListener('click',e=>{const b=e.target.closest('[data-speak]');if(!b)return;const w=current[Number(b.dataset.speak)];if(!w)return;if(!('speechSynthesis'in window)){status.textContent='当前设备不支持语音。';return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(w.word);u.lang='en-US';u.rate=.85;u.onerror=()=>status.textContent='英语声音暂时不可用，请检查设备语音设置。';speechSynthesis.speak(u);});
window.addEventListener('pagehide',()=>{if('speechSynthesis'in window)speechSynthesis.cancel();});
