import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8').replace(/\r/g,'');
const helpers=html.slice(html.indexOf('const TAU='),html.indexOf('/* =====================================================================\n   1.'));
const model=html.slice(html.indexOf('const G0='),html.indexOf('/* =====================================================================\n   3.'));
const a=vm.runInNewContext(helpers+model+';({compute,development,evalMoonTour,propagate,MOONS,PH})');
const c={mission:'moon',launcher:'super',bus:'S',power:'solarL',comm:'hga15',passes:1,inst:['cam'],vault:false,margin:20,missionType:'orbiter',schedule:'standard',autonomy:'ground'};
const orbiter=a.compute(c),lander=a.compute({...c,missionType:'lander'}),autonomous=a.compute({...c,autonomy:'advanced'});
assert.ok(lander.dry>orbiter.dry&&lander.cost>orbiter.cost&&lander.prop>orbiter.prop);
assert.ok(autonomous.dry>orbiter.dry&&autonomous.cost>orbiter.cost);
assert.ok(a.development({...c,schedule:'crunch'}).days<a.development(c).days);
let safe=null;for(let i=1;i<200&&!safe;i++){const r=a.evalMoonTour('saturn',['titan','enceladus'],[i/10+.2,2.7],i/10);if(r.ok&&!r.crash&&r.bound)safe=r}
assert.ok(safe,'a feasible moon tour exists');
for(const l of safe.legs){const s=a.propagate(l.r1,l.v1,l.dt,a.PH.saturn.mu);assert.ok(Math.hypot(s.r[0]-l.r2[0],s.r[1]-l.r2[1])<1000)}
console.log('Engineering, development and moon-tour checks passed');
