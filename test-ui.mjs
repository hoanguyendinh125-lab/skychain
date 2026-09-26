import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import * as core from './public/core.js';
const mapCss=fs.readFileSync('public/map.css','utf8');
assert.equal((mapCss.match(/{/g)||[]).length,(mapCss.match(/}/g)||[]).length,'Map CSS must contain balanced blocks');
assert.match(mapCss,/\.map-shell\s*{[^}]*isolation:\s*isolate/s);
assert.doesNotMatch(mapCss,/\.bottom-nav[^}]*position:\s*relative/s);
assert.doesNotMatch(mapCss,/\.modal(?:-backdrop)?[^}]*position:\s*relative/s);
assert.doesNotMatch(mapCss,/\.leaflet-pane[^}]*position:\s*relative/s);
const elements=new Map(),events={};const get=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',dataset:{},hidden:false,inert:false,classList:{add(){},remove(){},toggle(){}},focus(){},addEventListener(){},setAttribute(){}});return elements.get(s)};
const context={...core,E:core.escape,console,URLSearchParams,Date,Math,Map,Promise,FormData,localStorage:{getItem(){return null},setItem(){},removeItem(){}},navigator:{onLine:true},window:{addEventListener(){},scrollTo(){}},document:{querySelector:get,querySelectorAll(){return []},addEventListener(n,fn){events[n]=fn},body:{classList:{add(){},remove(){}}},activeElement:null},mountMap(){},updateMap(){},recenter(){},unmount(){},locate(){},searchPlace(){},setTimeout(){},clearTimeout(){},setInterval(fn){context.liveTick=fn}};
vm.createContext(context);const source=fs.readFileSync('public/app.js','utf8').replace(/^import .*;\n/gm,'');vm.runInContext(source,context);
const run=s=>vm.runInContext(s,context);
assert.match(get('#app').innerHTML,/splash/);
run("S.screen='login';render()");assert.match(get('#app').innerHTML,/id="loginForm"/);
for(const view of ['home','orders','tracking','fleet','stations','notifications','account','support']){run(`S.screen='app';S.role='facility';S.view='${view}';render()`);assert.ok(get('#app').innerHTML.includes('bottom-nav'));assert.ok(!get('#app').innerHTML.includes('undefined'))}
run("S.role='facility';create()");assert.match(get('#modalRoot').innerHTML,/Loại hàng/);
for(const step of [2,3,4]){run(`flow.step=${step};showFlow()`);assert.ok(get('#modalRoot').innerHTML.includes('flowForm'))}
run("closeModal();detail()");assert.match(get('#modalRoot').innerHTML,/Chuỗi lạnh/);
run('closeModal();showUav(0)');assert.match(get('#modalRoot').innerHTML,/SC-UAV-01/);
run('closeModal();showStation(1)');assert.match(get('#modalRoot').innerHTML,/Mường Phăng/);
run("closeModal();current().step=3;current().otpExpires=Date.now()+300000;receive()");assert.match(get('#modalRoot').innerHTML,/otpForm/);
console.log('PASS: splash/login/roles, 16 role/view renders, four request steps, shipment/cold-chain detail, fleet/station, OTP UI. DOM smoke only; no browser, GPS or external OpenStreetMap availability asserted.');
