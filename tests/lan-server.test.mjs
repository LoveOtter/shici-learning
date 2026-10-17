import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {createLanServer,isLocalAddress,lanAddresses} from '../serve.mjs';

test('LAN server serves home, vocabulary and seekable audio without exposing source files',async()=>{
  const temporary=await mkdtemp(path.join(os.tmpdir(),'shici-lan-'));
  const root=path.join(temporary,'dist');await mkdir(root);
  await writeFile(path.join(root,'lan.html'),'日语首页');
  await writeFile(path.join(root,'japanese.html'),'词库');
  await writeFile(path.join(root,'sample.mp3'),'0123456789');
  const learning='{"words":["一","habit"]}';
  await writeFile(path.join(root,'learning.json'),learning);
  await writeFile(path.join(root,'learning.json.gz'),gzipSync(learning));
  await writeFile(path.join(temporary,'private.txt'),'must never be served');
  const server=createLanServer({root});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try {
    let response=await fetch(base+'/');assert.equal(response.status,200);assert.equal(await response.text(),'日语首页');
    response=await fetch(base+'/japanese.html');assert.equal(await response.text(),'词库');
    response=await fetch(base+'/sample.mp3',{headers:{Range:'bytes=3-6'}});
    assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),'bytes 3-6/10');assert.equal(await response.text(),'3456');
    response=await fetch(base+'/sample.mp3',{headers:{Range:'bytes=-3'}});assert.equal(await response.text(),'789');
    response=await fetch(base+'/sample.mp3',{headers:{Range:'bytes=30-'}});assert.equal(response.status,416);
    response=await fetch(base+'/sample.mp3',{method:'HEAD'});assert.equal(response.headers.get('content-length'),'10');assert.equal(await response.text(),'');
    response=await fetch(base+'/learning.json',{headers:{'Accept-Encoding':'gzip'}});assert.equal(response.headers.get('content-encoding'),'gzip');assert.equal(response.headers.get('content-type'),'application/json; charset=utf-8');assert.equal(await response.text(),learning);
    response=await fetch(base+'/learning.json',{headers:{'Accept-Encoding':'identity'}});assert.equal(response.headers.get('content-encoding'),null);assert.equal(await response.text(),learning);
    response=await fetch(base+'/learning.json',{headers:{'Accept-Encoding':'gzip',Range:'bytes=0-7'}});assert.equal(response.status,206);assert.equal(response.headers.get('content-encoding'),null);assert.equal(await response.text(),learning.slice(0,8));
    for(const request of ['/..%5cprivate.txt','/%2e%2e%2fprivate.txt','/missing.json','/%ZZ']){
      response=await fetch(base+request);assert.ok([400,403,404].includes(response.status));assert.ok(!(await response.text()).includes('must never be served'));
    }
    response=await fetch(base+'/',{method:'POST'});assert.equal(response.status,405);
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(temporary,{recursive:true,force:true});}
});

test('LAN address selection excludes public, loopback and virtual interfaces',()=>{
  for(const address of ['127.0.0.1','::1','::ffff:192.168.6.9','10.1.2.3','172.16.0.1','172.31.255.255'])assert.equal(isLocalAddress(address),true);
  for(const address of ['8.8.8.8','172.32.0.1','192.168.999.1',''])assert.equal(isLocalAddress(address),false);
  const interfaces={Ethernet:[{family:'IPv4',internal:false,address:'192.168.6.9',netmask:'255.255.255.0'}],VMware:[{family:'IPv4',internal:false,address:'192.168.127.1',netmask:'255.255.255.0'}],Tunnel:[{family:'IPv4',internal:false,address:'192.168.60.46',netmask:'255.255.255.255'}]};
  assert.deepEqual(lanAddresses(interfaces),[{name:'Ethernet',address:'192.168.6.9'}]);
});
