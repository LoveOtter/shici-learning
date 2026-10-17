// Let the Windows launcher reuse this app without starting a second server.
try {
  const response=await fetch('http://127.0.0.1:5173/',{signal:AbortSignal.timeout(2000)});
  process.exitCode=response.ok&&response.headers.get('x-shici-server')==='lan-v1'?0:1;
  await response.body?.cancel();
} catch {process.exitCode=1;}
