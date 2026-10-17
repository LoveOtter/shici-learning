/** Full upstream dataset is loaded by level, never embedded in the application JS.
 * Source content is CC BY-NC 4.0, attributed to egg rolls.
 */
export const JAPANESE_SOURCE={author:'egg rolls',repository:'https://github.com/5mdld/anki-jlpt-decks',license:'CC-BY-NC-4.0',revision:'853798a4dec3630cad1984aa1c7edab31b09d109'};
export const JAPANESE_LEVELS=['N5','N4','N3','N2','N1'];
export function mediaUrl(filename){
 if(typeof filename!=='string'||!filename||filename.includes('/')||filename.includes('\\')||filename==='.'||filename==='..')throw Error('Invalid media filename');
 return `./data/vendor/eggrolls/media/${encodeURIComponent(filename)}`;
}
export function normalizeJapaneseNote(note){
 if(!note||typeof note.id!=='string'||!note.id.startsWith('eggrolls:')||!JAPANESE_LEVELS.includes(note.level)||typeof note.word!=='string'||typeof note.meaningSC!=='string'||!Array.isArray(note.sentences))throw Error('Invalid Japanese note');
 return {...note,language:'ja',audioUrls:(note.wordAudio||[]).map(mediaUrl),examples:note.sentences.map(s=>({...s,audioUrls:(s.audio||[]).map(mediaUrl)}))};
}
export async function loadJapaneseLevel(level,{fetchImpl=globalThis.fetch}={}){
 if(!JAPANESE_LEVELS.includes(level))throw Error('Unknown Japanese level');
 const response=await fetchImpl(`./data/japanese/${level}.json`);if(!response.ok)throw Error(`词库读取失败（${response.status}），请重试。`);
 const notes=await response.json();if(!Array.isArray(notes))throw Error('词库格式不正确。');
 // Keep the author's learning order rather than the CSV export's record order.
 return notes.map(normalizeJapaneseNote).sort((a,b)=>{
  const order=n=>n.sort&&Number.isFinite(Number(n.sort))?Number(n.sort):Infinity;
  return order(a)-order(b)||a.id.localeCompare(b.id);
 });
}
export function findJapaneseNotes(notes,query=''){
 const q=query.trim().normalize('NFKC').toLowerCase();return q?notes.filter(n=>`${n.word} ${n.furiganaMarkup} ${n.meaningSC} ${n.meaningTC} ${n.pos}`.normalize('NFKC').toLowerCase().includes(q)):notes;
}
