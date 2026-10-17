import {readFile,mkdir,writeFile} from 'node:fs/promises';
const notes=JSON.parse(await readFile('data/japanese/all-notes.json','utf8'));
const words=notes.sort((a,b)=>Number(a.sort)-Number(b.sort)).map(n=>{
 const example=n.sentences.find(s=>!s.type&&s.text)||n.sentences[0];
 const plain=value=>String(value||'').replace(/<[^>]*>/g,'').replace(/([^\s[\]]+)\[([^\]]+)\]/g,'$2');
 return {id:n.id,word:n.word,ipa:plain(n.furiganaMarkup),meaning:n.meaningSC,pos:n.pos,deck:n.level,decks:[n.level],pitch:n.pitch,example:example?.text||'',translation:example?.translationSC||'',audio:n.wordAudio.map(filename=>'./data/vendor/eggrolls/media/'+encodeURIComponent(filename)),exampleAudio:(example?.audio||[]).map(filename=>'./data/vendor/eggrolls/media/'+encodeURIComponent(filename)),source:'eggrolls'};
});
const decks=['N5','N4','N3','N2','N1'].map(id=>({id,name:`日语 ${id}`,label:id,count:words.filter(w=>w.deck===id).length}));
await mkdir('data/learning',{recursive:true});
await writeFile('data/learning/japanese.json',JSON.stringify({words,decks}));
console.log(`Prepared ${words.length} Japanese learning cards; original fields remain in the source dataset.`);
