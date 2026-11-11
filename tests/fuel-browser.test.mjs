import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=createServer(async(req,res)=>{try{if(req.url==='/favicon.ico'){res.writeHead(204);return res.end()}res.setHeader('Content-Type',(req.url==='/'||req.url.endsWith('.html'))?'text/html':'application/octet-stream');res.end(await readFile(new URL('..'+(req.url==='/'?'/index.html':req.url),import.meta.url)))}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:process.env.PW_CHANNEL||'chrome',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
async function boot(id='moon',extra={}){const page=await browser.newPage({viewport:{width:1280,height:850}});page.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__game);await page.evaluate(({id,extra})=>{const g=window.__game;g.start(id);g.set({launcher:'super',bus:'S',power:'solarL',comm:'hga15',inst:['cam'],vault:false,margin:20,missionType:'orbiter',...extra});g.signAll();g.ts(40);g.launch()},{id,extra});return page}
try{
let page=await boot();await page.waitForFunction(()=>{const g=window.__game;if(g.phase==='cruise'&&g.fuel()?.burns.some(b=>b.label==='Cruise TCM'&&b.end)){g.ts(0);return true}return false});await page.evaluate(()=>window.__game.ts(0));assert.equal(await page.locator('#fuelHud').isVisible(),true);
const before=await page.evaluate(()=>window.__game.fuel());await page.evaluate(()=>{window.__game.testBurn(120,'Gauge verification');window.__game.ts(1)});await page.waitForTimeout(250);await page.evaluate(()=>window.__game.ts(0));const after=await page.evaluate(()=>window.__game.fuel()),row=after.burns.find(b=>b.label==='Gauge verification');
assert.ok(after.main<before.main&&row.delivered>0&&row.delivered<120);const m0=before.dry+before.main+before.ion+before.attitude;assert.ok(Math.abs(row.used-m0*(-Math.expm1(-row.delivered/(320*9.80665))))<1e-7);assert.equal(after.attitude,before.attitude);
await page.evaluate(()=>window.__game.fuelSet({main:0}));assert.ok((await page.locator('#fuelRequired').textContent()).includes('LOW PROPELLANT'));await page.close();console.log('Live rocket-equation gauge passed');
page=await boot('moon',{launcher:'med',bus:'L',power:'solarXL',comm:'hga6',inst:['cam','spec','radar','thermal','laser','mag'],vault:true,margin:30,missionType:'rover'});assert.equal(await page.evaluate(()=>window.__game.runTo('report')),'report');const stage=await page.evaluate(()=>window.__game.stage());assert.ok(stage.ratio>1&&stage.cutoff.time>0&&stage.cutoff.altitude>0&&stage.impact);assert.ok((await page.locator('#repTitle').textContent()).includes('Launch failure'));assert.ok((await page.locator('#burnReport').textContent()).includes('Ascent T+'));await page.close();console.log('Overloaded stage burnout and ballistic impact passed');
assert.deepEqual(errors,[]);console.log('Propellant browser checks: zero console/page errors');
}finally{await browser.close();await new Promise(r=>server.close(r))}
