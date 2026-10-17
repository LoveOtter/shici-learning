export const GRAMMAR_LEVELS=['N5','N4','N3','N2','N1'];
export const GRAMMAR_SOURCES={
 taekim:{author:'Tae Kim',translator:'pizzamx / wokanxing.info',repository:'https://github.com/ShenHongFei/jp-grammar-guide',license:'CC-BY-NC-SA-3.0-US',revision:'4df92cfbf0bd7b6ed73e3af913951dfe6e58278f'},
 jld:{author:'Justin Kindrix and contributors',repository:'https://github.com/jkindrix/japanese-language-data',license:'CC-BY-SA-4.0',revision:'04014e06019fc9d4af76e6dbb64ec709fe863c4d'}
};
export async function loadGrammar(source,{level='N5',fetchImpl=globalThis.fetch}={}){
 if(!Object.hasOwn(GRAMMAR_SOURCES,source))throw Error('未知语法资源。');
 if(source==='jld'&&!GRAMMAR_LEVELS.includes(level))throw Error('未知语法等级。');
 const response=await fetchImpl(source==='taekim'?'./data/grammar/taekim-guide.json':`./data/grammar/jld-${level}.json`);
 if(!response.ok)throw Error(`语法资料读取失败（${response.status}）。`);
 const items=await response.json();if(!Array.isArray(items))throw Error('语法资料格式不正确。');
 for(const item of items){
  if(!item||typeof item.id!=='string'||!item.id.startsWith(source+':')||item.source?.revision!==GRAMMAR_SOURCES[source].revision)throw Error('语法资料版本或编号不正确。');
  if(source==='taekim'&&(typeof item.title!=='string'||typeof item.contentHtml!=='string'))throw Error('教程格式不正确。');
  if(source==='jld'&&(item.level!==level||typeof item.pattern!=='string'||typeof item.meaningEnglish!=='string'||!Array.isArray(item.examples)))throw Error('语法点格式不正确。');
 }
 return items;
}
export function findGrammar(items,query='',group='全部'){
 const q=query.trim().normalize('NFKC').toLowerCase();
 return items.filter(item=>(group==='全部'||item.group===group)&&(!q||[item.title,item.searchText,item.pattern,item.meaningEnglish,item.explanationEnglish,item.formation,...(item.examples||[]).map(e=>e.japanese)].filter(Boolean).join(' ').normalize('NFKC').toLowerCase().includes(q)));
}
