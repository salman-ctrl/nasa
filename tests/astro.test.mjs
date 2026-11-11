import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8').replace(/\r/g,'');
const engine=html.slice(html.indexOf('const G0='),html.indexOf('/* =====================================================================\n   2. MISSION DATA'));
const helpers=html.slice(html.indexOf('const TAU='),html.indexOf('/* =====================================================================\n   1. ASTRODYNAMICS'));
export const astro=vm.runInNewContext(helpers+'\n'+engine+'\n({evalRoute,jdOf,ephemPos,lambert,propagate,tuneDE,MU_SUN,DAY,PH,flybyConic,conicPoint,aimSolution})');
const {evalRoute,jdOf,ephemPos,lambert,propagate,tuneDE,MU_SUN,DAY}=astro;
const historical=(seq,dates)=>{const j=dates.map(d=>jdOf(...d));return evalRoute(seq,j[0],j.slice(1).map((v,i)=>v-j[i]),false)};
const near=(v,w,t)=>assert.ok(Math.abs(v-w)<=t,`${v} expected ${w} Â± ${t}`);
const v1=historical(['earth','jupiter','saturn'],[[1977,9,5],[1979,3,5],[1980,11,12]]);
near(v1.flybys[0].rpR,4.85,.3);
const nh=historical(['earth','jupiter','pluto'],[[2006,1,19],[2007,2,28],[2015,7,14]]);
near(nh.c3,158,5);near(nh.flybys[0].rpR,33.6,2);
const v2=historical(['earth','jupiter','saturn','uranus','neptune'],[[1977,8,20],[1979,7,9],[1981,8,26],[1986,1,24],[1989,8,25]]);
assert.equal(v2.crash,0);near(v2.flybys[1].rpR,2.7,.3);
for(const route of [v1,nh,v2])for(const l of route.legs){const s=propagate(l.r1,l.v1,l.dt,MU_SUN);assert.ok(Math.hypot(s.r[0]-l.r2[0],s.r[1]-l.r2[1])<1000)}
for(const route of [v1,nh,v2])for(const f of route.flybys){
 const c=astro.flybyConic(route,f),q=astro.conicPoint(c,0);
 near(Math.hypot(...q),f.rp,1);
 for(const [t,expected] of [[-c.ti*1e5,c.vi],[c.to*1e5,c.vo]]){
  const a=astro.conicPoint(c,t),b=astro.conicPoint(c,t+10),v=[(b[0]-a[0])/10,(b[1]-a[1])/10];
  const cosine=(v[0]*expected[0]+v[1]*expected[1])/(Math.hypot(...v)*Math.hypot(...expected));
  assert.ok(cosine>0.999999,'conic asymptote aligns with Lambert velocity');
 }
}
for(const f of v2.flybys){
 const p=astro.PH[f.id],b=f.rp*Math.sqrt(1+2*p.mu/(f.rp*f.vin*f.vin));
 const planned=astro.aimSolution(v2,f,b),changed=astro.aimSolution(v2,f,b*.95);
 assert.ok(planned.correction<1e-6,'planned aiming has zero correction');
 assert.ok(planned.miss<1000,'planned aiming hits next body');
 assert.ok(changed.correction>1&&changed.miss>1000,'changed aiming changes path and burn');
 assert.ok(astro.aimSolution(v2,f,0).tooClose,'central aim crashes');
}
let wins=0;
for(const seed of [7,31,101,2026]){const seq=['earth','mars','earth','jupiter'];const t=tuneDE(seq,true,{jdMin:jdOf(2026,1,1),jdMax:jdOf(2040,12,31),seed});const r=evalRoute(seq,t.jd0,t.tofs,true);console.log('Auto-tune',seed,(r.dvEq/1000).toFixed(3),r.crash);if(r.ok&&!r.crash&&r.dvEq<=6000)wins++}
assert.ok(wins>=3,`${wins}/4 optimizer seeds passed`);
console.log('Astrodynamics regressions passed', {voyager1:v1.flybys[0].rpR,newHorizonsC3:nh.c3,voyager2Saturn:v2.flybys[1].rpR});

