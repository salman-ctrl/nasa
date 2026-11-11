import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8').replace(/\r/g,'');
const helpers=html.slice(html.indexOf('const TAU='),html.indexOf('/* =====================================================================\n   1.'));
const engine=html.slice(html.indexOf('const G0='),html.indexOf('/* =====================================================================\n   2.'));
const a=vm.runInNewContext(helpers+engine+';({fuelLoad,fuelMass,availableImpulse,spendImpulse,ISP,G0,makeLaunchStages,stepLaunchStages})');
const t=a.fuelLoad(500,2000,.1),copy={...t};
const expected=a.fuelMass(t)*(-Math.expm1(-800/(a.ISP*a.G0)));
const burn=a.spendImpulse(t,'main',800);
assert.ok(Math.abs(burn.used-expected)<1e-9);
for(let i=0;i<80;i++)a.spendImpulse(copy,'main',10);
assert.ok(Math.abs(copy.main-t.main)<1e-8,'integration independent of frame partition');
const attitude=t.attitude,ion=t.ion,capacity=a.availableImpulse(t);
const empty=a.spendImpulse(t,'main',1e6);
assert.ok(Math.abs(empty.delivered-capacity)<1e-8);assert.equal(t.main,0);
assert.equal(t.attitude,attitude);assert.equal(t.ion,ion);
assert.equal(a.spendImpulse(t,'main',50).delivered,0);
assert.ok(Number.isFinite(a.fuelMass(t))&&a.fuelMass(t)>=t.dry);
const ionT=a.fuelLoad(500,2000,.1,100);
assert.ok(ionT.ion>0);assert.ok(a.spendImpulse(ionT,'ion',50,3000).delivered>49.999);
console.log('Rocket-equation fuel conservation, partitioning and empty-tank checks passed');

const light=a.makeLaunchStages({m0:6000},4000,2000),heavy=a.makeLaunchStages({m0:6000},8000,2000);
for(const stage of [light,heavy]){for(let i=0;i<1000&&!stage.cutoff;i++)a.stepLaunchStages(stage,1);assert.ok(stage.cutoff);assert.equal(stage.stages[0].remaining,0);}
assert.ok(heavy.cutoff.time<light.cutoff.time&&heavy.cutoff.altitude<light.cutoff.altitude,'heavier overload exhausts earlier and lower');
for(let i=0;i<10000&&!heavy.impact;i++)a.stepLaunchStages(heavy,1,false);
assert.equal(heavy.impact,true);console.log('Stage burnout and ballistic impact checks passed',light.cutoff.time,heavy.cutoff.time);
