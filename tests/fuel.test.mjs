import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8').replace(/\r/g,'');
const helpers=html.slice(html.indexOf('const TAU='),html.indexOf('/* =====================================================================\n   1.'));
const engine=html.slice(html.indexOf('const G0='),html.indexOf('/* =====================================================================\n   2.'));
const a=vm.runInNewContext(helpers+engine+';({fuelLoad,fuelMass,availableImpulse,spendImpulse,ISP,G0,makeLaunchStages,stepLaunchStages,captureState,partialVelocity,assessEncounter,ephemPos,jdOf,DAY,MU_SUN,lambert,stepEDL})');
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
assert.ok(Math.abs(heavy.cutoff.time-light.cutoff.time)<.001&&heavy.impulse<light.impulse,'overload keeps burn time and reduces delivered impulse');
for(let i=0;i<10000&&!heavy.impact;i++)a.stepLaunchStages(heavy,1,false);
assert.equal(heavy.impact,true);console.log('Stage burnout and ballistic impact checks passed',light.cutoff.time,heavy.cutoff.time);

const mu=4.282837e13,rp=3900000,vinf=3000,before=Math.sqrt(vinf*vinf+2*mu/rp),planned=before-Math.sqrt(mu*1.9/rp);
const full=a.captureState(mu,rp,vinf,planned,planned),bound=a.captureState(mu,rp,vinf,planned,planned-1),escape=a.captureState(mu,rp,vinf,planned,10);
assert.ok(full.bound&&Math.abs(full.e-.9)<1e-10);assert.ok(bound.bound&&bound.e>full.e);assert.ok(!escape.bound&&escape.energy>0);
const v=a.partialVelocity([100,20],[200,40],100,25);assert.ok(Math.abs(v[0]-125)<1e-12&&Math.abs(v[1]-25)<1e-12);
const jd=a.jdOf(2027,1,1),duration=260*a.DAY,r1=a.ephemPos('earth',jd),r2=a.ephemPos('mars',jd+260),l=a.lambert(r1,r2,duration,a.MU_SUN);
assert.ok(a.assessEncounter(r1,l.v1,'mars',jd,duration).impact,'a real intercept impacts');
assert.ok(!a.assessEncounter(r1,[l.v1[0]+3000,l.v1[1]],'mars',jd,duration).impact,'a propagated miss does not explode');
console.log('Partial capture energy and correction/intersection checks passed');

const reserve=a.fuelLoad(500,2000,.1),mainBefore=reserve.main;a.spendImpulse(reserve,'attitude',100,60);assert.equal(reserve.attitude,0);assert.equal(reserve.main,mainBefore);
const xenon=a.fuelLoad(500,2000,.1,100);assert.ok(Math.abs(a.availableImpulse(xenon,'ion',3000)-110)<1e-8,'ion load covers early correction on full wet mass');
const descent={moon:true,h:1000,v:50,mass:500,fuel:0,engine:true,chute:false,heat:0,t:0};for(let i=0;i<10000&&descent.h>0;i++)a.stepEDL(descent,.01);assert.ok(Math.abs(descent.v-Math.sqrt(50**2+2*1.62*1000))<.1,'empty descent tank follows lunar free fall');
console.log('Separate attitude reserve, wet-mass xenon loading and empty-tank free fall passed');
