import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const shots=fileURLToPath(new URL('./shots/',import.meta.url));await mkdir(shots,{recursive:true});
const server=createServer(async(req,res)=>{try{if(req.url==='/favicon.ico'){res.writeHead(204);return res.end()}res.setHeader('Content-Type',req.url==='/'||req.url.endsWith('.html')?'text/html':req.url.endsWith('.json')?'application/json':'application/octet-stream');res.end(await readFile(new URL('..'+(req.url==='/'?'/index.html':req.url),import.meta.url)))}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:process.env.PW_CHANNEL||'chrome',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
async function select(page,key,value){await page.locator(`[data-k="${key}"][data-v="${value}"]`).click()}
async function play(id,kind){const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(id,e.message)});page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.addInitScript(()=>{window.playAudit={phases:[],projectionErrors:[],launchFrames:0};const observe=()=>{const g=window.__game,a=window.playAudit;if(g){if(a.phases.at(-1)?.phase!==g.phase)a.phases.push({phase:g.phase,at:performance.now()});const s=g.launchScreen();if(s){a.launchFrames++;if(s.ts!==1||s.points.some(p=>!Number.isFinite(p.x)||Math.abs(p.x)>1||Math.abs(p.y)>1||p.z< -1||p.z>1))a.projectionErrors.push(s)}}requestAnimationFrame(observe)};requestAnimationFrame(observe)});
await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__game);await page.evaluate(()=>window.__game.ts(1));
if(id==='voyager2')await page.locator('[data-l="voyager2"]').click();else{
 await page.locator(`[data-m="${id}"]`).click();await select(page,'launcher',kind==='overload'?'med':'super');await select(page,'bus',kind==='overload'?'L':'S');await select(page,'power',kind==='overload'?'solarXL':id==='moon'||id==='mars'?'solarL':'rtg4');await select(page,'comm',kind==='overload'?'hga6':'hga15');
 if(kind==='crash')await select(page,'missionType','lander');
 if(kind==='overload'){await select(page,'missionType','rover');await page.locator('#r-mar').focus();await page.keyboard.press('End')}
 if(kind==='lander'||kind==='rover')await select(page,'missionType',kind);
 if(id==='jupiter'||id==='saturn'){for(const instrument of ['cam','spec','mag'])await page.locator(`[data-i="${instrument}"]`).click();if(id==='jupiter')await page.locator('#c-vault').check()}
 await page.locator('#btnNext').click();await page.locator('#developmentGo').click();
 if(id==='jupiter'){await page.locator('[data-add="mars"]').click();await page.locator('[data-add="earth"]').click();for(let attempt=0;attempt<4;attempt++){await page.locator('#btnTune').click();await page.waitForFunction(()=>!document.getElementById('btnTune').disabled,{},{timeout:120000});if(await page.evaluate(()=>window.__game.compute().launchOK&&!window.__game.rr().crash))break}assert.ok(await page.evaluate(()=>window.__game.compute().launchOK&&!window.__game.rr().crash),'actual Auto-tune UI must produce a launchable safe Jupiter route')}
 if(id==='moon'){await page.locator('#roleSign').click();await page.locator('#btnNext').click()}else{await page.locator('#roleSign').click();await page.locator('#btnLaunch2').click()}
}
if(id==='voyager2')await page.locator('#btnLaunch2').click();
const captured=new Set(),pauseStates=new Set(),deadline=Date.now()+360000;let tourTuned=false;
while(Date.now()<deadline){const phase=await page.evaluate(()=>window.__game.phase);
 if(!captured.has(phase)){captured.add(phase);await page.screenshot({path:`${shots}/${id}-${kind}-${phase}.png`});console.log(id,kind,phase)}
 if(phase==='report')break;
 if(phase==='cruise'&&await page.locator('#cruisePause').isVisible())pauseStates.add(await page.locator('#cruisePause').textContent());
 if(phase==='landing'){assert.ok(await page.locator('#landingTimeline').isVisible());assert.ok(!(await page.locator('#hudPhase').textContent()).includes('Capture'));if(id==='moon'){assert.ok(!(await page.locator('#landingInstructions').textContent()).includes('parachute'));assert.equal(await page.locator('#deployChute').isVisible(),false)}}
 if(await page.locator('#evt').isVisible()){assert.ok(await page.evaluate(()=>+getComputedStyle(document.getElementById('fuelHud')).zIndex<+getComputedStyle(document.getElementById('evt')).zIndex));const first=page.locator('#evtOpts button').first();if(await first.isEnabled())await first.click();if(await page.locator('#evtGo').isVisible())await page.locator('#evtGo').click()}
 if(await page.locator('#aimModal').isVisible())await page.locator('#aimGo').click();
 if(await page.locator('#aeroModal').isVisible())await page.locator('#aeroSkip').click();
 if(await page.locator('#tourModal').isVisible()){if(!tourTuned){const before=await page.locator('#tourReadout').textContent();await page.locator('#tourTune').click();assert.notEqual(await page.locator('#tourReadout').textContent(),before,'tour Auto-tune button must update the route');tourTuned=true;if(id==='saturn'){assert.equal(await page.locator('#tourGo').isEnabled(),true);await page.locator('#tourGo').click();assert.ok(await page.evaluate(()=>window.__game.moonTour()?.flying),'Fly tour button must start execution')}else{await page.locator('#tourSkip').click();assert.equal(await page.locator('#tourModal').isVisible(),false)}}}
 if(kind!=='crash'&&phase==='landing'&&await page.locator('#landingAuto').isVisible()&&!(await page.evaluate(()=>window.__game.landing()?.auto)))await page.locator('#landingAuto').click();
 await page.waitForTimeout(150);
}
assert.equal(await page.evaluate(()=>window.__game.phase),'report');const audit=await page.evaluate(()=>window.playAudit);assert.deepEqual(audit.projectionErrors,[],'rocket must stay in viewport on every rendered frame');assert.ok(audit.launchFrames>30);assert.deepEqual(errors,[]);
if(kind==='lander'||kind==='rover'){const order=audit.phases.map(p=>p.phase).filter(p=>['launch','cruise','capture','landing','ops','report'].includes(p));assert.deepEqual(order,['launch','cruise','capture','landing','ops','report']);assert.notEqual(await page.locator('#repTitle').textContent(),'Landing impact');const landing=audit.phases.find(p=>p.phase==='landing'),ops=audit.phases.find(p=>p.phase==='ops'),capture=audit.phases.find(p=>p.phase==='capture');assert.ok((ops.at-landing.at)/1000>=25&&(ops.at-landing.at)/1000<=40,'descent must give the player 25-40 seconds');assert.ok(landing.at-capture.at>=3000,'capture must be visible');}
if(kind==='overload')assert.match(await page.locator('#repTitle').textContent(),/Launch failure/);
const fuel=await page.evaluate(()=>window.__game.fuel());assert.ok(!fuel.burns.some(b=>b.label==='Anomaly: wheel'));if(id!=='voyager2'){assert.ok(!(await page.locator('#repLessons').textContent()).includes('Team contributions:'));}if(kind==='crash'){assert.equal(await page.locator('#repTitle').textContent(),'Landing impact');assert.ok((await page.locator('#repBars .bar i').evaluateAll(es=>es.map(e=>e.style.width))).every(w=>w==='0%'));}const launchBurn=fuel.burns.find(b=>b.tank==='launch vehicle');if(kind!=='overload'){assert.ok(launchBurn.end.startsWith('Burnout (nominal)'));assert.equal(launchBurn.emptyAt,null);assert.ok(Math.abs(launchBurn.planned-launchBurn.delivered)<.001)}assert.ok(launchBurn.used<=800000.01);
for(const stage of ['liftoff','maxq','separation','cutoff'])assert.ok(fuel.launchMessages.some(m=>m.key===stage),'launch status '+stage);if(kind!=='overload'){assert.ok(pauseStates.has('Cruise paused: burn in progress'));assert.ok(pauseStates.has('Cruise paused: waiting for your decision'))}if(id==='jupiter'||id==='saturn')assert.deepEqual(audit.phases.map(p=>p.phase).filter(p=>['launch','cruise','capture','ops','report'].includes(p)),['launch','cruise','capture','ops','report']);if(id==='voyager2')assert.ok(audit.phases.some(p=>p.phase==='ops'),'Voyager 2 must reach its final encounter');
const result={id,kind,title:await page.locator('#repTitle').textContent(),...audit,pauseStates:[...pauseStates],errors};results.push(result);await writeFile(`${shots}/real-player-results.json`,JSON.stringify(results,null,2));console.log('PASS',id,kind,result.title,'frames',audit.launchFrames);await page.close()}
try{const missions=process.env.REAL_MISSIONS?.split(',')||['moon:lander','mars:rover','jupiter:orbiter','saturn:orbiter','voyager2:legend'];for(const m of missions){const [id,kind]=m.split(':');await play(id,kind)}}finally{await browser.close();await new Promise(r=>server.close(r))}
