import {loadJapaneseLevel,findJapaneseNotes} from './japanese-data.js';
import {ankiFuriganaText} from './japanese-furigana.js';
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const size=20;let notes=[],filtered=[],current=1,report=null,generation=0,activeAudio=null;
const results=document.getElementById('results'),summary=document.getElementById('summary');
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');setTimeout(()=>el.classList.remove('visible'),4000);}
function stopAudio(){if(activeAudio){activeAudio.pause();activeAudio=null;}if('speechSynthesis'in window)speechSynthesis.cancel();}
function plainReading(value){const doc=new DOMParser().parseFromString(value,'text/html');return doc.body.textContent||'';}
function ruby(value){
 const doc=new DOMParser().parseFromString(value||'','text/html');
 const safe=node=>{if(node.nodeType===Node.TEXT_NODE)return ankiFuriganaText(node.textContent);if(node.nodeType!==Node.ELEMENT_NODE)return '';if(['SCRIPT','STYLE','IFRAME','OBJECT'].includes(node.tagName))return '';const content=Array.from(node.childNodes).map(safe).join('');if(['RUBY','RT','RP'].includes(node.tagName))return `<${node.tagName.toLowerCase()}>${content}</${node.tagName.toLowerCase()}>`;return content;};
 return Array.from(doc.body.childNodes).map(safe).join('');
}
function render(){
 const pages=Math.max(1,Math.ceil(filtered.length/size));current=Math.min(current,pages);const traditional=document.getElementById('traditional').checked;
 results.innerHTML=filtered.slice((current-1)*size,current*size).map(n=>`<article class="catalog-row"><span class="pill soft">${esc(n.level)}</span><span class="pill soft">${esc(n.pos)}</span><h2 lang="ja">${esc(n.word)}</h2><div class="catalog-reading" lang="ja">${ruby(n.furiganaMarkup)}</div>${n.pitch?`<p class="muted">声调：${esc(n.pitch)}</p>`:''}<p class="definition">${esc(traditional?n.meaningTC:n.meaningSC)}</p><button class="audio-button" data-action="audio" data-id="${esc(n.id)}">听单词</button>${n.extra?`<details><summary>补充用法</summary><p>${esc(n.extra)}</p></details>`:''}${n.examples.length?`<details><summary>例句与关联表达 · ${n.examples.length} 条</summary>${n.examples.map((s,i)=>`<div class="example"><small>${esc(s.type)}</small><p lang="ja">${s.furiganaMarkup?ruby(s.furiganaMarkup):esc(s.text)}</p><span>${esc(traditional?s.translationTC:s.translationSC)}</span>${s.audioUrls.length||s.text?`<br><button class="audio-button" data-action="audio" data-id="${esc(n.id)}" data-example="${i}">听例句</button>`:''}</div>`).join('')}</details>`:'<p class="muted">此词条未提供例句或关联表达。</p>'}</article>`).join('')||'<div class="catalog-loading">没有找到匹配的词条。</div>';
 document.getElementById('page-status').textContent=`${current} / ${pages}`;document.getElementById('previous').disabled=current<=1;document.getElementById('next').disabled=current>=pages;
 summary.textContent=report?`已导入 ${report.notes.toLocaleString()} 个词条，${report.audioFiles.toLocaleString()} 个音频文件。当前 ${document.getElementById('level').value}：${notes.length.toLocaleString()} 个，匹配 ${filtered.length.toLocaleString()} 个。`:`当前词书 ${notes.length} 个词条，匹配 ${filtered.length} 个。`;
}
function filter(){filtered=findJapaneseNotes(notes,document.getElementById('query').value);current=1;render();}
async function load(){const token=++generation;stopAudio();results.innerHTML='<div class="catalog-loading">正在加载本等级词库…</div>';document.getElementById('previous').disabled=true;document.getElementById('next').disabled=true;try{const next=await loadJapaneseLevel(document.getElementById('level').value);if(token!==generation)return;notes=next;filter();}catch(e){if(token===generation){results.innerHTML=`<div class="catalog-loading">${esc(e.message)}<br><button class="secondary" data-action="retry">重新加载</button></div>`;summary.textContent='加载失败，请重试。';}}}
async function speakOrPlay(urls,text){stopAudio();if(urls.length){activeAudio=new Audio(urls[0]);try{await activeAudio.play();return;}catch{toast('本地音频无法播放，正在尝试设备日语语音。');}}if(!('speechSynthesis'in window)){toast('当前设备无法播放日语语音。');return;}const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=.85;const voice=speechSynthesis.getVoices().find(v=>v.lang.startsWith('ja'));if(voice)u.voice=voice;u.onerror=e=>{if(!['interrupted','canceled'].includes(e.error))toast('日语声音暂时不可用，请检查设备语音设置。');};speechSynthesis.speak(u);}
document.getElementById('level').addEventListener('change',load);document.getElementById('query').addEventListener('input',filter);document.getElementById('traditional').addEventListener('change',render);
document.getElementById('previous').addEventListener('click',()=>{stopAudio();current--;render();window.scrollTo(0,0);});document.getElementById('next').addEventListener('click',()=>{stopAudio();current++;render();window.scrollTo(0,0);});
results.addEventListener('click',e=>{const button=e.target.closest('[data-action]');if(!button)return;if(button.dataset.action==='retry'){load();return;}const n=notes.find(n=>n.id===button.dataset.id);if(!n)return;const example=button.dataset.example;if(example!==undefined){const s=n.examples[Number(example)];speakOrPlay(s.audioUrls,s.text||plainReading(s.furiganaMarkup));}else speakOrPlay(n.audioUrls,n.word);});
window.addEventListener('pagehide',stopAudio);
try{const r=await fetch('./data/japanese/import-report.json');if(r.ok)report=await r.json();}catch{}
await load();
