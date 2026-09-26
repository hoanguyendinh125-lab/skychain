// Optional local launcher for the exported source; not part of the deployed Site.
import http from 'node:http';
import worker from './dist/server/index.js';
const port=3000;
http.createServer(async(req,res)=>{
 try{
  const request=new Request(new URL(req.url,'http://localhost:'+port),{method:req.method});
  const response=await worker.fetch(request,{OSM_TILE_URL:process.env.OSM_TILE_URL||'',OSM_FALLBACK_TILE_URL:process.env.OSM_FALLBACK_TILE_URL||'',OSM_SEARCH_URL:process.env.OSM_SEARCH_URL||''});
  res.writeHead(response.status,Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('Lỗi chạy ứng dụng. Hãy build lại rồi khởi động lại.');}
}).listen(port,'127.0.0.1',()=>console.log('SkyChain: http://localhost:'+port));
