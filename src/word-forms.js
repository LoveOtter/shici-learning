const labels={p:'过去式',d:'过去分词',i:'现在分词',3:'第三人称单数',r:'比较级',t:'最高级',s:'复数',0:'原形'};
export function formatWordForms(exchange=''){
 return exchange.split('/').map(part=>{
  const split=part.indexOf(':'),label=labels[part.slice(0,split)],value=part.slice(split+1).trim();
  return split>0&&label&&value?`${label}：${value}`:'';
 }).filter(Boolean).join('；');
}
