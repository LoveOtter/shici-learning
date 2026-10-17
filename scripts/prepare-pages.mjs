// Prepare a static public site without changing the LAN deployment or copying private files.
import {copyFile,mkdir,readdir,readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=path.join(project,'dist');
const output=process.env.SHICI_PAGES_OUTPUT?path.resolve(project,process.env.SHICI_PAGES_OUTPUT):path.resolve(project,'..','shici-github-pages');
await mkdir(output,{recursive:true});
const copied=[];
async function copyTree(folder,relative=''){
  for(const entry of await readdir(folder,{withFileTypes:true})){
    const name=path.posix.join(relative,entry.name),source=path.join(folder,entry.name),target=path.join(output,name);
    if(entry.isSymbolicLink())throw Error('Symlinks are not allowed in the public site.');
    if(entry.isDirectory()){await mkdir(target,{recursive:true});await copyTree(source,name);continue;}
    if(entry.name.endsWith('.gz')||name==='data/japanese/all-notes.json'||/\.(otf|ttf)$/i.test(name))continue;
    await copyFile(source,target);copied.push(name);
  }
}
await copyTree(input);
// Preserve language query parameters and all routes under a GitHub project subdirectory.
await copyFile(path.join(input,'index.html'),path.join(output,'learn.html'));
copied.push('learn.html');
let home=await readFile(path.join(input,'lan.html'),'utf8');
home=home.replace('使用时保持电脑服务运行；手机连接同一局域网。','手机、电脑均可通过此网址使用。公共资料联网读取，个人记录保存在各自设备。');
home=home.replace('</head>','<link rel="manifest" href="./manifest.webmanifest"></head>');
await writeFile(path.join(output,'index.html'),home);
await writeFile(path.join(output,'lan.html'),home);
for(const name of [...new Set(copied)]){
  if(!/\.(html|js)$/.test(name))continue;
  const target=path.join(output,name);
  let body=await readFile(target,'utf8');
  body=body.replaceAll('./index.html?lang=','./learn.html?lang=')
    .replaceAll('普通局域网网页需要电脑服务与网络连接。','公共学习资料通过网络读取，个人记录保存在当前设备。');
  await writeFile(target,body);
}
const manifest=JSON.parse(await readFile(path.join(output,'manifest.webmanifest'),'utf8'));
manifest.id='./';manifest.start_url='./';manifest.scope='./';
await writeFile(path.join(output,'manifest.webmanifest'),JSON.stringify(manifest));
await writeFile(path.join(output,'.nojekyll'),'');
await writeFile(path.join(output,'sw.js'),`const PREFIX='shici-pages-'+self.registration.scope+'-';
const CACHE=PREFIX+'v1';
const FILES=['./','./index.html','./learn.html','./app.js','./styles.css','./font-settings.css','./font-settings.js','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest','./FSRS-LICENSE.txt'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
 if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname)||request.headers.has('range')||/\\.(mp3|ogg|wav|m4a)$/i.test(url.pathname))return;
 const network=fetch(request);event.waitUntil(network.then(async response=>{if(response.status===200)try{await(await caches.open(CACHE)).put(request,response.clone());}catch{}}).catch(()=>{}));
 event.respondWith(network.then(response=>response.clone()).catch(async()=>{
  const cached=await caches.match(request);if(cached)return cached;
  if(request.mode==='navigate'&&url.pathname.endsWith('/learn.html'))return(await caches.match('./learn.html'))||Response.error();
  if(request.mode==='navigate')return new Response('<meta charset="utf-8"><meta name="viewport" content="width=device-width"><h1>请连接网络后重试</h1><p>此资料尚未缓存，个人学习记录仍保存在当前浏览器。</p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
  return Response.error();
 }));
});\n`);
await writeFile(path.join(output,'README.md'),`# 拾词 · 手机与电脑上的英语、日语学习\n\n这是 GitHub Pages 静态发布文件。打开网站首页，选择英语或日语开始学习。\n\n学习记录保存在浏览器，可在“我的”中导出和恢复备份。切换网址或设备前请先备份。网站没有云端个人记录数据库。\n\n公共资料含原作者维护的词汇、语法草稿及例句，尚未完成独立语言审校。本项目用于个人、非商业学习。各来源保留各自许可，不将整个网站统一视为 MIT 授权。详见 [来源与许可](ATTRIBUTION.md)。\n\n发布包保留全部词条、27,060 个原音频和语法资料；未包含用不到的源字段汇总副本、服务器预压缩副本及字体文件。\n`);
await writeFile(path.join(output,'ATTRIBUTION.md'),`# 来源与许可\n\n- **egg rolls**：[anki-jlpt-decks](https://github.com/5mdld/anki-jlpt-decks)，固定版本 853798a4dec3630cad1984aa1c7edab31b09d109。10,641 条日语词汇，媒体包含合成语音。原 CSV 转换为 JSON，按等级组织，适配注音与音频路径；[CC BY-NC 4.0](data/vendor/eggrolls/LICENSE.txt) 与[来源记录](data/vendor/eggrolls/SOURCE.json)。仅限许可允许的非商业用途。\n- **Tae Kim**，中文译者 **pizzamx / wokanxing.info**：[中文指南](https://res.wokanxing.info/jpgramma/index.html)，[GitHub 镜像](https://github.com/ShenHongFei/jp-grammar-guide)，固定版本 4df92cfbf0bd7b6ed73e3af913951dfe6e58278f。70 个链接章节，包括 8 个原练习页；移除上游脚本，适配阅读、跳转与答案展开。正文及本项目的正文改编沿用 [CC BY-NC-SA 3.0 US](data/vendor/taekim/CONTENT-LICENSE.txt)。\n- **Justin Kindrix 与贡献者**：[Japanese Language Data](https://github.com/jkindrix/japanese-language-data)，固定版本 04014e06019fc9d4af76e6dbb64ec709fe863c4d。仅选用原创 grammar-curated 的 595 个分级草稿语法点，映射为应用数据；该内容及其改编沿用 [CC BY-SA 4.0](data/vendor/jld-grammar/LICENSE.txt)。[上游署名说明](data/vendor/jld-grammar/ATTRIBUTION.md)。\n- **skywind3000 / ECDICT 贡献者**：[ECDICT](https://github.com/skywind3000/ECDICT)，固定版本 bc015ed2e24a7abef49fc6dbbb7fe32c1dadaf8b，770,611 条英汉词典记录；按首字母分包，选取学习词书，适配显示；[MIT 许可](data/vendor/ecdict/LICENSE.txt) 与[来源记录](data/vendor/ecdict/SOURCE.json)。英语声音使用设备朗读。\n- **Open Spaced Repetition / ts-fsrs 贡献者**：[ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)，5.2.3，用于安排间隔复习；[MIT 许可](FSRS-LICENSE.txt)。\n\n语言学习流程参考语境学习与主动回忆；本项目与“不背单词”应用无关联。\n`);
let count=0,bytes=0,audio=0;
async function measure(folder){for(const entry of await readdir(folder,{withFileTypes:true})){const target=path.join(folder,entry.name);if(entry.isDirectory()){if(entry.name!=='.git')await measure(target);}else{count++;bytes+=(await stat(target)).size;if(/\.(mp3|ogg|wav|m4a)$/i.test(entry.name))audio++;}}}
await measure(output);
if(bytes>=1_000_000_000)throw Error('The public site exceeds the GitHub Pages 1 GB limit.');
if(audio!==27060)throw Error('Audio inventory does not match the imported snapshot.');
console.log(JSON.stringify({directory:output,files:count,bytes,audio,home:'index.html',learning:'learn.html',noPrivateSourceCopied:true}));
