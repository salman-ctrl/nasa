import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8').replace(/\r/g,'');
const helpers=html.slice(html.indexOf('const TAU='),html.indexOf('/* =====================================================================\n   1.'));
const engine=html.slice(html.indexOf('const G0='),html.indexOf('/* =====================================================================\n   2.'));
const a=vm.runInNewContext(helpers+engine+';({fuelLoad,fuelMass,spendImpulse,availableImpulse,advanceEDL,edlReplayScale,G0})');
function run(moon,ts,frame){const tanks=a.fuelLoad(900,moon?2100:1600,.2),mass=a.fuelMass(tanks),s={moon,h:moon?40000:125000,v:moon?800:5500,mass,initialMass:mass,maxThrust:mass*25,fuel:a.availableImpulse(tanks),heat:0,t:0,engine:false,chute:false,auto:false};const scale=a.edlReplayScale(s,tanks),feed=dv=>a.spendImpulse(tanks,'main',dv).delivered;
 feed.mass=()=>a.fuelMass(tanks);feed.capacity=()=>a.availableImpulse(tanks);feed.before=()=>{if(s.t>=2)s.auto=true};
 let frames=0;while(s.h>0&&frames++<100000)a.advanceEDL(s,frame*ts*scale,feed);
 assert.ok(s.h<=0&&s.v<3&&s.heat<20,`${moon?'Moon':'Mars'} must soft-land with sufficient propellant`);
 assert.ok(s.t/scale>=25&&s.t/scale<=40);return{h:s.h,v:s.v,t:s.t,heat:s.heat,main:tanks.main,mass:s.mass}}
for(const moon of [true,false]){const reference=run(moon,1,1/60);for(const ts of [1,6,40])for(const frame of [1/60,1/10,.2,.013])assert.deepEqual(run(moon,ts,frame),reference,`EDL must be invariant: moon=${moon}, ts=${ts}, frame=${frame}`);console.log(moon?'Moon':'Mars','fixed-step soft landing identical at ts 1/6/40 and 5-77 fps',reference)}
