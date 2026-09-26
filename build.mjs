import fs from 'node:fs';
const assets={};
for(const name of fs.readdirSync('public')){const ext=name.split('.').pop(),type={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',webmanifest:'application/manifest+json',png:'image/png'}[ext];if(type)assets['/'+name]={body:fs.readFileSync('public/'+name).toString('base64'),type};}
fs.rmSync('dist',{recursive:true,force:true});
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
fs.writeFileSync('dist/server/index.js','const assets='+JSON.stringify(assets)+';\n'+fs.readFileSync('worker.js','utf8'));
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built Worker and '+Object.keys(assets).length+' app assets.');
