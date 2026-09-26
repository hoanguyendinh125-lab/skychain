export default {async fetch(request,env,ctx){
 const url=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 if(url.pathname==='/api/map-config')return Response.json({tileUrl:'/api/tiles/{z}/{x}/{y}.png',fallbackTileUrl:env.OSM_FALLBACK_TILE_URL||'https://tile.openstreetmap.de/{z}/{x}/{y}.png',searchUrl:env.OSM_SEARCH_URL||'https://nominatim.openstreetmap.org/search'},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 const tile=url.pathname.match(/^\/api\/tiles\/(\d+)\/(\d+)\/(\d+)\.png$/);
 if(tile){
  const z=+tile[1],x=+tile[2],y=+tile[3],limit=2**z;
  if(z>19||x>=limit||y>=limit)return new Response('Invalid tile',{status:400});
  const cache=globalThis.caches?.default,cached=cache&&await cache.match(request);
  if(cached)return cached;
  const template=env.OSM_TILE_URL||'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const upstream=template.replace('{z}',z).replace('{x}',x).replace('{y}',y);
  try{
   const result=await fetch(upstream,{headers:{Accept:'image/png,image/*;q=0.8,*/*;q=0.5','User-Agent':'SkyChain/1.0 (+https://skychain-mobile.hoanguyendinh125.chatgpt.site/)'}});
   if(!result.ok)return new Response('Tile unavailable',{status:result.status});
   const response=new Response(request.method==='HEAD'?null:result.body,{headers:{'Content-Type':result.headers.get('Content-Type')||'image/png','Cache-Control':'public, max-age=604800','X-Content-Type-Options':'nosniff'}});
   if(cache&&request.method==='GET')ctx?.waitUntil(cache.put(request,response.clone()));
   return response;
  }catch{return new Response('Tile unavailable',{status:502})}
 }
 const asset=assets[url.pathname==='/'?'/index.html':url.pathname];
 if(!asset)return new Response('Not found',{status:404});
 const data=Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0));
 return new Response(request.method==='HEAD'?null:data,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin',...(url.pathname==='/sw.js'?{'Service-Worker-Allowed':'/'}:{})}});
}};
