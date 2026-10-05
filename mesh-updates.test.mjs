import assert from 'node:assert/strict';
import {MeshUpdates} from './mesh-updates.js';
const jobs=[],results=[],timers=new Map();let id=0;
const updater=new MeshUpdates({
 createWorker:()=>{const worker={terminated:false,terminate(){this.terminated=true;},postMessage(p){this.params=p;}};jobs.push(worker);return worker;},
 onResult:(data,meta)=>results.push(meta),
 setTimer:fn=>{timers.set(++id,fn);return id;},clearTimer:id=>timers.delete(id)
});
updater.request({count:100,resolution:120});
assert.equal(jobs.length,1,'First input must start immediately');assert.equal(jobs[0].params.resolution,72);
updater.request({count:110,resolution:120});updater.request({count:120,resolution:120});
assert.equal(jobs.length,1,'Do not repeatedly cancel a preview while dragging');assert.equal(jobs[0].terminated,false);
jobs[0].onmessage({data:{}});assert.equal(jobs.length,2);assert.equal(jobs[1].params.count,120,'Next preview uses latest parameters');
assert.equal(results[0].current,false);
updater.refine();assert.equal(jobs.length,2,'Refinement waits for active preview');
jobs[1].onmessage({data:{}});assert.equal(jobs.length,3);assert.equal(jobs[2].params.resolution,120);
updater.request({count:130,resolution:160});assert.equal(jobs[2].terminated,true,'New input interrupts slow final build');
assert.equal(jobs[3].params.resolution,72);
jobs[2].onmessage({data:{}});assert.equal(results.length,2,'Ignore late replies from terminated work');
updater.refine();jobs[3].onmessage({data:{}});jobs[4].onmessage({data:{}});
assert.equal(results.at(-1).preview,false);assert.equal(results.at(-1).current,true);assert.equal(results.at(-1).params.count,130);
updater.request({count:140,resolution:120});updater.cancel();jobs[5].onmessage({data:{}});assert.equal(jobs.length,6);assert.equal(timers.size,0);
console.log('PASS: immediate previews, latest-value queuing, final refinement, cancellation, stale-result rejection');
// Browser timers require their Window receiver; injected fake timers masked this.
const originalSet=globalThis.setTimeout,originalClear=globalThis.clearTimeout;
try {
 globalThis.setTimeout=function(){assert.equal(this,globalThis,'Browser setTimeout requires the global receiver');return 1;};
 globalThis.clearTimeout=function(){assert.equal(this,globalThis,'Browser clearTimeout requires the global receiver');};
 let started=false;
 const browserTimers=new MeshUpdates({createWorker:()=>({terminate(){},postMessage(){started=true;}}),onResult(){}});
 browserTimers.request({resolution:120});assert.ok(started,'Startup must reach the first mesh request');browserTimers.cancel();
}finally{globalThis.setTimeout=originalSet;globalThis.clearTimeout=originalClear;}
console.log('PASS: native browser timer receiver and initial startup dispatch');
