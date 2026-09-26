import {places,atProgress} from './core.js';

const DEFAULT_CONFIG={
 tileUrl:'/api/tiles/{z}/{x}/{y}.png',
 fallbackTileUrl:'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
 searchUrl:'https://nominatim.openstreetmap.org/search'
};
let leafletPromise,configPromise,map,canvas,markers=[],lines=[],generation=0,currentHost,selectedOrder,currentBounds,resizeObserver;
let clickHandler,lastSearchAt=0;
const searchCache=new Map();
const point=p=>[p.lat,p.lng];
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function message(text){currentHost?.querySelector('.map-status')?.replaceChildren(document.createTextNode(text))}

async function mapConfig(){
 if(configPromise)return configPromise;
 configPromise=fetch('/api/map-config').then(async response=>response.ok?{...DEFAULT_CONFIG,...await response.json()}:DEFAULT_CONFIG).catch(()=>DEFAULT_CONFIG);
 return configPromise;
}

function leafletReady(){
 if(window.L)return Promise.resolve(window.L);
 if(leafletPromise)return leafletPromise;
 leafletPromise=new Promise((resolve,reject)=>{
  if(!document.getElementById('leafletCSS')){
   const link=document.createElement('link');
   link.id='leafletCSS';link.rel='stylesheet';link.crossOrigin='';
   link.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
   link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
   document.head.append(link);
  }
  const existing=document.getElementById('leafletSDK');
  if(existing){existing.addEventListener('load',()=>resolve(window.L),{once:true});existing.addEventListener('error',reject,{once:true});return}
  const script=document.createElement('script');
  script.id='leafletSDK';script.async=true;script.crossOrigin='';
  script.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
  script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload=()=>resolve(window.L);
  script.onerror=()=>{leafletPromise=null;script.remove();reject(Error('Không thể tải thư viện bản đồ.'))};
  document.head.append(script);
 });
 return leafletPromise;
}

function clean(){
 if(resizeObserver)resizeObserver.disconnect();
 resizeObserver=null;
 if(map&&clickHandler)map.off('click',clickHandler);
 if(map)map.remove();
 map=null;canvas=null;markers=[];lines=[];clickHandler=null;currentBounds=null;
}

function icon(L,kind){
 const paths={hospital:'M12 4v16 M4 12h16',uav:'M3 11l18-8-8 18-2-8z M11 13l10-10',station:'M18 9c0 5-6 11-6 11S6 14 6 9a6 6 0 1112 0 M12 7v4',gps:'M18 12a6 6 0 11-12 0 6 6 0 0112 0'};
 const html='<div class="map-pin '+kind+'"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="'+paths[kind]+'"/></svg></div>';
 return L.divIcon({className:'sky-map-icon',html,iconSize:[32,32],iconAnchor:[16,16],popupAnchor:[0,-18]});
}

function pin(L,p,kind,title){
 const marker=L.marker(point(p),{icon:icon(L,kind),title,alt:title,keyboard:true}).addTo(map);
 marker.bindTooltip(title,{direction:'top',offset:[0,-18]});
 markers.push(marker);
 return marker;
}

function fit(bounds){if(map&&bounds?.isValid())map.fitBounds(bounds,{padding:[42,42],maxZoom:13})}

export async function mountMap(host,{order,select,location,fleet=false}={}){
 if(!host)return;
 const token=++generation;
 clean();currentHost=host;selectedOrder=order;
 host.innerHTML='<div class="map-canvas"><div class="map-loading"><span></span><span></span><span></span></div></div><p class="map-status" role="status">Đang tải OpenStreetMap…</p>';
 try{
  const [L,config]=await Promise.all([leafletReady(),mapConfig()]);
  if(token!==generation)return;
  const slot=host.querySelector('.map-canvas');
  canvas=document.createElement('div');canvas.className='map-native';slot.replaceChildren(canvas);
  map=L.map(canvas,{zoomControl:false,attributionControl:true,preferCanvas:true,scrollWheelZoom:false});
  const tileOptions={maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'};
  let tileErrors=0,switched=false,tileLayer=L.tileLayer(config.tileUrl,tileOptions).addTo(map);
  tileLayer.on('tileload',()=>canvas.classList.add('map-tiles-ready'));
  tileLayer.on('tileerror',()=>{
   if(switched||++tileErrors<2)return;
   switched=true;map.removeLayer(tileLayer);
   tileLayer=L.tileLayer(config.fallbackTileUrl,tileOptions).addTo(map);
   tileLayer.on('tileload',()=>canvas.classList.add('map-tiles-ready'));
   tileLayer.on('tileerror',()=>message('Không tải được nền bản đồ. Tuyến và vị trí mô phỏng vẫn hoạt động.'));
  });
  const a=order?.from||places[0],b=order?.to||location||places[1];
  pin(L,a,'hospital',a.label||a.name);pin(L,b,'station',b.label||b.name);
  if(order){
   lines.push(L.polyline([point(a),point(b)],{color:'#1373a2',opacity:.35,weight:5}).addTo(map));
   lines.push(L.polyline([point(a),point(atProgress(order))],{color:'#00bde9',opacity:1,weight:5}).addTo(map));
   const moving=pin(L,atProgress(order),'uav','Phương tiện mô phỏng');moving.skyMoving=true;
  }
  if(fleet){pin(L,places[2],'uav','SC-UAV-02 · sẵn sàng (demo)');pin(L,places[0],'uav','SC-UAV-01 · sẵn sàng (demo)')}
  if(select){
   clickHandler=e=>{
    const p={lat:e.latlng.lat,lng:e.latlng.lng,name:'Vị trí đã chọn',label:'Điểm nhận trên bản đồ'};
    markers.filter(marker=>marker.skyChosen).forEach(marker=>{map.removeLayer(marker);markers.splice(markers.indexOf(marker),1)});
    const chosen=pin(L,p,'station','Điểm nhận đã chọn');chosen.skyChosen=true;select(p);
   };
   map.on('click',clickHandler);
   message('Chạm bản đồ để chọn điểm nhận · © OpenStreetMap contributors');
  }else message('OpenStreetMap · Tuyến và phương tiện mô phỏng');
  currentBounds=L.latLngBounds([point(a),point(b)]);fit(currentBounds);
  if(location)map.setView(point(location),13);
  const controls=document.createElement('div');controls.className='map-controls';
  controls.innerHTML='<button type="button" data-map="center" aria-label="Xem toàn tuyến">⌖</button><button type="button" data-map="zoom" aria-label="Phóng to">+</button><button type="button" data-map="out" aria-label="Thu nhỏ">−</button><button type="button" data-map="contrast" aria-label="Đổi độ tương phản">◐</button>';
  controls.onclick=e=>{const v=e.target.closest('button')?.dataset.map;if(v==='center')fit(currentBounds);if(v==='zoom')map.zoomIn();if(v==='out')map.zoomOut();if(v==='contrast')canvas.classList.toggle('map-contrast')};
  slot.append(controls);
  const refreshSize=()=>{
   if(token===generation&&map&&canvas?.isConnected)map.invalidateSize({pan:false});
  };
  if('ResizeObserver'in window){resizeObserver=new ResizeObserver(refreshSize);resizeObserver.observe(host)}
  requestAnimationFrame(refreshSize);
  setTimeout(refreshSize,300);
 }catch{
  if(token!==generation)return;
  message('Không thể tải OpenStreetMap. Kiểm tra kết nối và thử lại.');
  host.querySelector('.map-canvas').innerHTML='<div class="map-error"><strong>Bản đồ chưa khả dụng</strong><button type="button" class="btn secondary" data-action="retryMap">Thử lại</button><a href="https://www.openstreetmap.org/#map=11/21.386/103.023" target="_blank" rel="noopener">Mở OpenStreetMap ↗</a></div>';
 }
}

export function updateMap(order){
 if(!map||selectedOrder?.id!==order.id)return;
 const moving=markers.find(marker=>marker.skyMoving);
 if(moving)moving.setLatLng(point(atProgress(order)));
 if(lines[1])lines[1].setLatLngs([point(order.from),point(atProgress(order))]);
}

export function recenter(){fit(currentBounds)}

export function unmount(){generation++;clean();currentHost=null;selectedOrder=null}

export async function locate(){
 if(!navigator.geolocation)throw Error('Thiết bị không hỗ trợ GPS. Hãy chọn điểm trên bản đồ.');
 return new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(position=>{
  const location={lat:position.coords.latitude,lng:position.coords.longitude,name:'Vị trí của tôi',label:'Vị trí GPS đã chọn',accuracy:position.coords.accuracy};
  if(map&&currentHost&&window.L){pin(window.L,location,'gps','Vị trí thiết bị');map.setView(point(location),15)}
  resolve(location);
 },error=>reject(Error(error.code===1?'SkyChain chưa có quyền truy cập vị trí. Bạn có thể chọn trên bản đồ.':'Chưa lấy được GPS. Thử lại hoặc chọn trên bản đồ.')),{enableHighAccuracy:true,timeout:12000,maximumAge:30000}))
}

export async function searchPlace(query){
 const normalized=query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 const local=places.filter(p=>(p.name+' '+p.label).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(normalized));
 if(local.length)return local;
 if(searchCache.has(normalized))return searchCache.get(normalized);
 await delay(Math.max(0,1000-(Date.now()-lastSearchAt)));lastSearchAt=Date.now();
 try{
  const {searchUrl}=await mapConfig();
  const url=searchUrl+'?'+new URLSearchParams({q:query+' Điện Biên Việt Nam',format:'jsonv2',limit:'4',countrycodes:'vn'});
  const response=await fetch(url,{headers:{Accept:'application/json','Accept-Language':'vi'}});
  if(!response.ok)throw Error();
  const results=(await response.json()).map(item=>({name:item.display_name,label:item.display_name,lat:Number(item.lat),lng:Number(item.lon)})).filter(item=>Number.isFinite(item.lat)&&Number.isFinite(item.lng));
  searchCache.set(normalized,results);return results;
 }catch{throw Error('Không tìm được địa chỉ. Chọn trạm gợi ý hoặc chạm bản đồ để chọn điểm nhận.')}
}
