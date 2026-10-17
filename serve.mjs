import http from 'node:http';
import {createReadStream} from 'node:fs';
import {realpath,stat} from 'node:fs/promises';
import {networkInterfaces} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.json':'application/json; charset=utf-8','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.m4a':'audio/mp4','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.png':'image/png'};

export function isLocalAddress(address='') {
  const ip=address.replace(/^::ffff:/,'');
  if(ip==='::1') return true;
  const parts=ip.split('.').map(Number);
  if(parts.length!==4 || parts.some(n=>!Number.isInteger(n)||n<0||n>255)) return false;
  return parts[0]===127 || parts[0]===10 || (parts[0]===172&&parts[1]>=16&&parts[1]<=31) || (parts[0]===192&&parts[1]===168) || (parts[0]===169&&parts[1]===254);
}

export function lanAddresses(interfaces=networkInterfaces()) {
  return Object.entries(interfaces).flatMap(([name,addresses])=>
    /vmware|virtual|vbox|docker|wsl|vethernet|loopback/i.test(name)?[]:
    (addresses||[]).filter(a=>a.family==='IPv4'&&!a.internal&&a.netmask!=='255.255.255.255'&&isLocalAddress(a.address)).map(a=>({name,address:a.address}))
  );
}

export function createLanServer({root=path.resolve('dist')}={}) {
  return http.createServer(async(req,res)=>{
    if(!isLocalAddress(req.socket.remoteAddress)){res.writeHead(403);res.end('Local network access only');return;}
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
    try {
      const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(name.includes('\\')||name.includes('\0')||name.split('/').includes('..')){res.writeHead(403);res.end();return;}
      const base=await realpath(root);
      const target=path.resolve(base,'.'+(name==='/'?'/lan.html':name));
      if(!target.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
      let resolved=await realpath(target);
      if(!resolved.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
      let info=await stat(resolved);
      if(!info.isFile()){res.writeHead(404);res.end('Not found');return;}
      res.setHeader('Content-Type',types[path.extname(resolved)]||'application/octet-stream');
      if(!req.headers.range&&path.extname(resolved)==='.json'&&/(?:^|,)\s*gzip\s*(?:,|$)/i.test(req.headers['accept-encoding']||'')){
        try {const packed=await realpath(resolved+'.gz');if(packed.startsWith(base+path.sep)){resolved=packed;info=await stat(packed);res.setHeader('Content-Encoding','gzip');}}catch{}
      }
      res.setHeader('Vary','Accept-Encoding');
      res.setHeader('X-Content-Type-Options','nosniff');
      res.setHeader('X-Shici-Server','lan-v1');
      res.setHeader('Cache-Control','no-cache');
      res.setHeader('Accept-Ranges','bytes');
      let start=0,end=info.size-1,status=200;
      if(req.headers.range) {
        const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        const valid=match&&(match[1]||match[2]);
        if(valid) {
          if(!match[1]) start=Math.max(0,info.size-Number(match[2]));
          else {start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
        }
        if(!valid||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=info.size){
          res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;
        }
        status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`);
      }
      res.setHeader('Content-Length',Math.max(0,end-start+1));
      res.writeHead(status);
      if(req.method==='HEAD'||info.size===0){res.end();return;}
      const stream=createReadStream(resolved,{start,end});
      stream.on('error',()=>res.destroy());
      res.on('close',()=>stream.destroy());
      stream.pipe(res);
    } catch(error) {
      if(res.headersSent){res.destroy();return;}
      const status=error instanceof URIError?400:['ENOENT','ENOTDIR'].includes(error.code)?404:500;
      res.writeHead(status);res.end(status===404?'Not found':'Unable to serve this request');
    }
  });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const port=Number(process.env.PORT||5173),host=process.env.HOST||'0.0.0.0';
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be between 1 and 65535');
  const server=createLanServer();
  server.on('error',error=>{
    console.error(error.code==='EADDRINUSE'?`端口 ${port} 已被占用。若拾词已在运行，请使用现有窗口；否则设置其他 PORT 后重试。`:`启动失败：${error.message}`);
    process.exitCode=1;
  });
  server.listen(port,host,()=>{
    console.log(`\n拾词已启动。保持此窗口打开，电脑不要进入睡眠。\n电脑访问：http://127.0.0.1:${port}/`);
    if(host==='0.0.0.0'){
      const addresses=lanAddresses();
      for(const {name,address} of addresses)console.log(`手机访问：http://${address}:${port}/  (${name})`);
      if(!addresses.length)console.log('未检测到局域网 IPv4 地址，请检查电脑的 Wi-Fi 或网线连接。');
    }else if(host!=='127.0.0.1')console.log(`手机访问：http://${host}:${port}/`);
    console.log('手机与电脑需连接同一局域网。按 Ctrl+C 停止。\n');
  });
}
