import {build} from 'esbuild';
import {mkdir,copyFile,cp,access,readFile,writeFile,readdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
await import('./scripts/prepare-learning.mjs');
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/app.js'],outfile:'dist/app.js',bundle:true,format:'esm',target:['safari16','chrome100'],minify:true,legalComments:'eof'});
for(const name of ['index.html','lan.html','styles.css','font-settings.css','font-settings.js','sw.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png']) await copyFile(`public/${name}`,`dist/${name}`);
await cp('node_modules/ts-fsrs/LICENSE','dist/FSRS-LICENSE.txt');
await build({entryPoints:['src/english-dictionary.js'],outfile:'dist/english-dictionary.js',bundle:true,format:'esm',target:['safari16','chrome100'],minify:true});
await copyFile('public/english-dictionary.html','dist/english-dictionary.html');
await cp('data/english','dist/data/english',{recursive:true});
await cp('data/learning','dist/data/learning',{recursive:true});
await mkdir('dist/data/vendor/ecdict',{recursive:true});
await copyFile('data/vendor/ecdict/LICENSE','dist/data/vendor/ecdict/LICENSE.txt');
await copyFile('data/vendor/ecdict/SOURCE.json','dist/data/vendor/ecdict/SOURCE.json');
for(const file of ['dist/data/english/learning.json','dist/data/learning/japanese.json',...(await readdir('dist/data/english/dictionary')).filter(n=>n.endsWith('.json')).map(n=>'dist/data/english/dictionary/'+n)])await writeFile(file+'.gz',gzipSync(await readFile(file)));
await access('data/japanese/import-report.json');
await build({entryPoints:['src/japanese-catalog.js'],outfile:'dist/japanese-catalog.js',bundle:true,format:'esm',target:['safari16','chrome100'],minify:true,legalComments:'eof'});
await copyFile('public/japanese.html','dist/japanese.html');
await cp('data/japanese','dist/data/japanese',{recursive:true});
await cp('data/vendor/eggrolls/media','dist/data/vendor/eggrolls/media',{recursive:true});
await copyFile('data/vendor/eggrolls/LICENSE','dist/data/vendor/eggrolls/LICENSE.txt');
await copyFile('data/vendor/eggrolls/SOURCE.json','dist/data/vendor/eggrolls/SOURCE.json');
await access('data/grammar/import-report.json');
await build({entryPoints:['src/japanese-grammar.js'],outfile:'dist/japanese-grammar.js',bundle:true,format:'esm',target:['safari16','chrome100'],minify:true,legalComments:'eof'});
await copyFile('public/grammar.html','dist/grammar.html');
await copyFile('public/grammar.css','dist/grammar.css');
await cp('data/grammar','dist/data/grammar',{recursive:true});
for(const [folder,files] of [['taekim',['CONTENT-LICENSE.txt','SOURCE.json']],['jld-grammar',['LICENSE','ATTRIBUTION.md','SOURCE.json']]]){
 for(const file of files){await mkdir(`dist/data/vendor/${folder}`,{recursive:true});await copyFile(`data/vendor/${folder}/${file}`,`dist/data/vendor/${folder}/${file==='LICENSE'?'LICENSE.txt':file}`);}
}
console.log('Built mobile application with bundled FSRS.');
