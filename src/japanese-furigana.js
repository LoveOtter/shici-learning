export const escapeJapaneseText=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/** Convert Anki's space-delimited base[reading] text, with escaped output.
 * Call on text nodes only, so source HTML never becomes executable markup.
 */
export function ankiFuriganaText(value){
 const text=String(value||'');let html='',end=0;
 const pattern=/(?:^|[ \t])([^\s[\]]+)\[([^\[\]]+)\]/g;
 for(const match of text.matchAll(pattern)){
  html+=escapeJapaneseText(text.slice(end,match.index));
  html+=`<ruby>${escapeJapaneseText(match[1])}<rt>${escapeJapaneseText(match[2])}</rt></ruby>`;
  end=match.index+match[0].length;
 }
 return html+escapeJapaneseText(text.slice(end));
}
