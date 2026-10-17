import {loadGrammar,findGrammar,GRAMMAR_LEVELS} from './japanese-grammar-data.js';
import {escapeJapaneseText as esc} from './japanese-furigana.js';
const $=id=>document.getElementById(id),size=10;
let source='taekim',items=[],filtered=[],page=1,generation=0,detailGeneration=0,loading=false,activeSpeech=null;
const cache=new Map();
function stopSpeech(){if(activeSpeech&&'speechSynthesis'in window)speechSynthesis.cancel();activeSpeech=null;}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');setTimeout(()=>$('toast').classList.remove('visible'),3500);}
function showList(){detailGeneration++;stopSpeech();$('grammar-detail').hidden=true;$('grammar-list').hidden=false;$('grammar-pagination').hidden=false;}
function draw(){
 if(loading)return;const pages=Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages);
 $('resource-status').textContent=source==='taekim'?`已接入 70 个中文章节页（含 8 个练习页）；当前匹配 ${filtered.length} 个。`:`已接入 595 个分级语法点；${$('grammar-level').value} 共 ${items.length} 个，匹配 ${filtered.length} 个。`;
 $('grammar-list').innerHTML=filtered.slice((page-1)*size,page*size).map(n=>`<article class="grammar-card"><span class="pill soft">${esc(source==='taekim'?n.group:n.level+' · 英文原文 · 待审')}</span><h2>${esc(n.title||n.pattern)}</h2><p>${esc((n.kind==='exercise'?'原资料练习，可展开查看答案。 ':source==='taekim'?'中文讲解与日语例句。 ':n.meaningEnglish+' ')+(source==='taekim'?n.searchText.slice(0,110):n.formation))}</p><button class="secondary" data-open="${esc(n.id)}">${source==='taekim'?'阅读本章':'查看接续与例句'}</button></article>`).join('')||'<div class="grammar-empty">没有找到匹配内容，请换个关键词。</div>';
 $('grammar-previous').disabled=page<=1;$('grammar-next').disabled=page>=pages;$('grammar-page').textContent=`${page} / ${pages}`;
}
function filter(){if(loading)return;filtered=findGrammar(items,$('grammar-search').value,source==='taekim'?$('grammar-group').value:'全部');page=1;showList();draw();}
async function getItems(kind,level){const key=kind+':'+level;if(cache.has(key))return cache.get(key);const rows=await loadGrammar(kind,{level});cache.set(key,rows);return rows;}
async function load(){
 const token=++generation;loading=true;items=[];filtered=[];showList();$('grammar-list').innerHTML='<div class="grammar-empty">正在加载语法资料…</div>';$('resource-status').textContent='正在加载资料…';$('grammar-previous').disabled=true;$('grammar-next').disabled=true;
 $('guide-tab').setAttribute('aria-pressed',source==='taekim');$('points-tab').setAttribute('aria-pressed',source==='jld');$('group-field').hidden=source!=='taekim';$('level-field').hidden=source!=='jld';
 $('resource-description').textContent=source==='taekim'?'Tae Kim 中文指南：从书写系统、基本语法到高级表达，按教程顺序阅读。保留原内容，尚未完成本项目独立审校。':'Japanese Language Data：查看接续、例句和相关语法。原文为英文，595 条均由上游标记为待审稿，供参考与后续中文整理。';
 $('grammar-search').placeholder=source==='taekim'?'搜索中文讲解或日语表达':'搜索日语句型或英文释义';
 try{const rows=await getItems(source,$('grammar-level').value);if(token!==generation)return;items=rows;if(source==='taekim'){const group=$('grammar-group').value;const groups=['全部',...new Set(items.map(n=>n.group))];$('grammar-group').innerHTML=groups.map(g=>`<option>${esc(g)}</option>`).join('');$('grammar-group').value=groups.includes(group)?group:'全部';}loading=false;filter();}
 catch(e){if(token!==generation)return;loading=false;$('grammar-list').innerHTML=`<div class="grammar-empty">${esc(e.message)}<br><button class="secondary" data-retry>重新加载</button></div>`;$('resource-status').textContent='资料加载失败，请重试。';}
}
function top(){window.scrollTo({top:0,behavior:'instant'});}
async function openItem(id,{updateUrl=true,anchor=''}={}){
 const token=++detailGeneration;stopSpeech();let n=items.find(n=>n.id===id);
 if(!n&&id.startsWith('jld:')){for(const level of GRAMMAR_LEVELS){const rows=await getItems('jld',level);n=rows.find(n=>n.id===id);if(n)break;}}
 if(!n){toast('没有找到对应资料。');return;}
 if(n.id.startsWith('jld:')&&n.relatedIds.length)await Promise.all(GRAMMAR_LEVELS.map(level=>getItems('jld',level)));
 if(token!==detailGeneration)return;
 const relatedNotes=new Map([...cache.values()].flat().map(item=>[item.id,item]));
 const detail=$('grammar-detail');$('grammar-list').hidden=true;$('grammar-pagination').hidden=true;detail.hidden=false;
 const attribution=n.id.startsWith('taekim:')?`Tae Kim 著 · pizzamx / wokanxing.info 译 · <a href="./data/vendor/taekim/CONTENT-LICENSE.txt">CC BY-NC-SA 3.0 US</a> · 内容适配后沿用同一许可。`:`Justin Kindrix and contributors · <a href="./data/vendor/jld-grammar/LICENSE.txt">CC BY-SA 4.0</a> · 英文原文 · 上游待审稿。`;
 const content=n.id.startsWith('taekim:')?n.contentHtml:`<h2>含义（英文原文）</h2><p lang="en">${esc(n.meaningEnglish)}</p><p lang="en">${esc(n.explanationEnglish)}</p><h2>接续</h2><p>${esc(n.formation)}</p><ul>${n.formationNotes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h2>例句</h2>${n.examples.map((e,i)=>`<div class="point-example"><p lang="ja">${esc(e.japanese)}</p><small lang="en">${esc(e.english)}</small><button class="audio-button" data-speak="${i}">设备日语朗读</button></div>`).join('')}<h2>相关语法</h2><div class="related-points">${n.relatedIds.map(x=>`<button data-open="${esc(x)}">${esc(relatedNotes.get(x)?.pattern||'相关表达')}</button>`).join('')||'<p>无相关条目。</p>'}</div>`;
 detail.innerHTML=`<button class="secondary back-to-list" data-back>返回列表</button><article class="grammar-reader"><h1>${esc(n.title||n.pattern)}</h1><p class="reader-meta">${esc(n.group||n.level)} · 本项目尚未独立审校。<br>${attribution}</p><div class="guide-content">${content}</div><div class="reader-source">${attribution}<br>修改：资料提取、编号和显示适配，未增加独立审校结论。<a href="${esc(n.source.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看对应原文</a></div></article>`;
 detail.dataset.itemId=n.id;
 if(updateUrl){const url=new URL(location.href);url.search='';url.searchParams.set(n.id.startsWith('taekim:')?'guide':'point',n.id.split(':').slice(1).join(':'));history.replaceState(null,'',url);}
 top();if(anchor){const target=document.getElementById(anchor);if(target&&detail.contains(target))target.scrollIntoView();}
}
async function fromUrl(){const url=new URL(location.href);const guide=url.searchParams.get('guide'),point=url.searchParams.get('point');if(guide){source='taekim';await load();if(!loading)await openItem('taekim:'+guide,{updateUrl:false,anchor:decodeURIComponent(url.hash.slice(1))});}else if(point){source='jld';await load();await openItem('jld:'+point,{updateUrl:false});}else await load();}
function clearUrl(){history.replaceState(null,'',location.pathname);}
$('guide-tab').addEventListener('click',()=>{source='taekim';$('grammar-search').value='';clearUrl();load();});$('points-tab').addEventListener('click',()=>{source='jld';$('grammar-search').value='';clearUrl();load();});
$('grammar-level').addEventListener('change',()=>{clearUrl();load();});$('grammar-group').addEventListener('change',filter);$('grammar-search').addEventListener('input',filter);
$('grammar-previous').addEventListener('click',()=>{page--;draw();top();});$('grammar-next').addEventListener('click',()=>{page++;draw();top();});
document.addEventListener('click',async event=>{const el=event.target.closest('[data-open],[data-back],[data-retry],[data-speak]');if(!el)return;
 if(el.hasAttribute('data-retry')){load();return;}if(el.hasAttribute('data-back')){clearUrl();showList();draw();top();return;}
 if(el.dataset.open){try{await openItem(el.dataset.open);}catch{toast('相关语法读取失败，请重试。');}return;}
 if(el.dataset.speak!==undefined){stopSpeech();const id=$('grammar-detail').dataset.itemId;const note=[...cache.values()].flat().find(n=>n.id===id);const text=note?.examples[Number(el.dataset.speak)]?.japanese;if(!text)return;if(!('speechSynthesis'in window)){toast('当前设备没有可用语音。');return;}const speech=new SpeechSynthesisUtterance(text);speech.lang='ja-JP';speech.rate=.85;const voice=speechSynthesis.getVoices().find(v=>v.lang.startsWith('ja'));if(voice)speech.voice=voice;speech.onerror=e=>{if(!['interrupted','canceled'].includes(e.error))toast('设备日语语音暂时不可用。');};activeSpeech=speech;speechSynthesis.speak(speech);}
});
window.addEventListener('pagehide',stopSpeech);window.addEventListener('popstate',fromUrl);
try{await fromUrl();}catch{toast('语法资料暂时无法读取。');}
