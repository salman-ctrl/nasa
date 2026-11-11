import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=createServer(async(req,res)=>{try{if(req.url==='/favicon.ico'){res.writeHead(204);return res.end()}const file=new URL('..'+(req.url==='/'?'/index.html':req.url),import.meta.url);const data=await readFile(file);res.setHeader('Content-Type',file.pathname.endsWith('.html')?'text/html':file.pathname.endsWith('.json')?'application/json':'application/octet-stream');res.end(data)}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:process.env.PW_CHANNEL||'chrome',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__game,{timeout:60000});
await page.evaluate(()=>{const g=window.__game;g.crew(4);g.start('moon');g.role(2)});
assert.equal(await page.locator('[data-k="launcher"]').first().isVisible(),false);
await page.evaluate(()=>window.__game.launch());assert.equal(await page.evaluate(()=>window.__game.phase),'design');
await page.evaluate(()=>window.__game.crew(1));
await page.locator('#playMode').selectOption('career');assert.equal(await page.locator('[data-m="mars"]').isDisabled(),true);await page.locator('#playMode').selectOption('free');
for(const id of ['moon','mars','jupiter','saturn','neptune','voyager2']){
await page.evaluate(id=>{const g=window.__game;g.ts(40);if(id==='voyager2')g.legend(id);else{g.start(id);g.set({launcher:'super',bus:'S',power:id==='moon'||id==='mars'?'solarL':'rtg4',comm:'hga15',inst:['mag'],vault:true,missionType:id==='moon'?'lander':id==='mars'?'rover':'orbiter'});if(id!=='moon')g.toRoute();if(id==='jupiter')g.route(['earth','mars','earth','jupiter'])}},id);
if(id==='jupiter')await page.evaluate(()=>window.__game.tune());
await page.evaluate(()=>{window.__game.signAll();window.__game.launch()});
if(id==='saturn'){await page.waitForFunction(()=>{window.__game.choose(0);return window.__game.moonTour()},{timeout:30000});const r=await page.evaluate(()=>{window.__game.moonTune();return window.__game.moonTour().result});assert.ok(r.ok&&!r.crash&&r.bound);await page.evaluate(()=>window.__game.moonFly())}
if(id==='mars'){await page.waitForFunction(()=>window.__game.phase==='cruise');await page.evaluate(()=>{window.__game.ts(0);window.__game.camera();window.__game.burn(420)});await page.waitForTimeout(150);assert.equal(await page.locator('#burnHud').isVisible(),true);await page.evaluate(()=>{window.__game.camera();window.__game.ts(40)})}
if(id==='voyager2'){
 await page.waitForFunction(()=>window.__game.aim(),{timeout:30000});
 const before=await page.evaluate(()=>window.__game.aim());assert.ok(before.correction<1e-6);
 const changed=await page.evaluate(()=>{window.__game.aimSet(.95);return window.__game.aim()});
 assert.ok(changed.correction>1&&changed.miss>before.miss+1000);
 await page.evaluate(()=>{window.__game.aimSet(1);window.__game.aimConfirm()});
 await page.waitForFunction(()=>window.__game.flyby(),{timeout:30000});
 await page.evaluate(()=>window.__game.ts(0));
 assert.ok((await page.evaluate(()=>window.__game.flyby())).rpR>9);assert.equal(await page.locator('#report').isVisible(),false);
 await page.screenshot({path:fileURLToPath(new URL('./flyby.png',import.meta.url))});
 await page.evaluate(()=>{window.__game.skipFly();window.__game.ts(40)});
}
const result=await page.evaluate(()=>window.__game.runTo('report'));assert.equal(result,'report',id);
if(id==='moon'||id==='mars')assert.notEqual(await page.locator('#repTitle').textContent(),'Landing impact');console.log(id,await page.locator('#repTitle').textContent());assert.ok(await page.evaluate(()=>window.__game.patch())>1000);
}
assert.deepEqual(errors,[]);console.log('Smoke passed: all missions and Voyager 2, zero console errors');
}finally{await browser.close();await new Promise(r=>server.close(r))}

