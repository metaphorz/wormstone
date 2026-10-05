import assert from 'node:assert/strict';
import {curve,buildStone,makeField} from './model.js';
const p={seed:42,radius:1,rough:.65,terms:7,smooth:1.2,count:32,bend:.65,twist:.7,weather:.65,resolution:34};
const r=curve(p),repeat=curve(p);for(let i=0;i<1000;i++){let t=i/1000*Math.PI*2;assert.equal(r(t),repeat(t));assert.ok(r(t)>0);assert.ok(Math.abs(r(t)-r(t+Math.PI*2))<1e-12);}assert.equal(curve({...p,rough:0})(1.4),1);
const solid=makeField({...p,count:0}),porous=makeField(p);assert.ok(solid.field(0,0,0)<0);for(let x=-2;x<2;x+=.2)assert.ok(porous.field(x,0,0)>=solid.field(x,0,0));
const t=performance.now(),mesh=buildStone(p);assert.ok(mesh.positions.length>0);assert.equal(mesh.positions.length,mesh.normals.length);assert.ok(mesh.positions.every(Number.isFinite));assert.ok(mesh.normals.every(Number.isFinite));
let reversed=0;for(let i=0;i<mesh.positions.length;i+=9){const a=mesh.positions.slice(i,i+3),b=mesh.positions.slice(i+3,i+6),c=mesh.positions.slice(i+6,i+9),u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const dot=cross.reduce((s,v,k)=>s+v*(mesh.normals[i+k]+mesh.normals[i+3+k]+mesh.normals[i+6+k]),0);if(dot< -1e-6)reversed++;}assert.equal(reversed,0);console.log(`PASS: reproducible positive profiles, solid/void subtraction, finite mesh, outward triangle winding (${Math.round(performance.now()-t)} ms)`);
// Regression: the dense specimen has open, individually separated mouths.
const settings={...p,count:2400,weather:.5};
const specimen=makeField(settings);
let openMouths=0;
for(const bore of specimen.tubes){
 const mouth=specimen.channelCenter(bore,.005);
 if(specimen.field(...mouth)>0)openMouths++;
 assert.ok(bore.depth>.5,'Channels must extend deeply into the stone');
}
assert.ok(openMouths>settings.count*.98,'Nearly all seeded mouths must remain visibly open');
let solidSamples=0,voidSamples=0,largeChambers=0;
const directions=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1],[.577,.577,.577],[-.577,.577,-.577]];
for(let x=-2.3;x<=2.3;x+=.15)for(let y=-1.4;y<=1.4;y+=.15)for(let z=-1.9;z<=1.9;z+=.15){
 if(specimen.outer(x,y,z)<0){solidSamples++;if(specimen.field(x,y,z)>0){voidSamples++;
 if(specimen.outer(x,y,z)<-.3&&directions.every(d=>[.04,.08,.12,.16,.20,.22].every(r=>specimen.field(x+d[0]*r,y+d[1]*r,z+d[2]*r)>0)))largeChambers++;
 }}
}
assert.ok(voidSamples/solidSamples>.05,'The specimen must contain meaningful channels');
assert.ok(voidSamples/solidSamples<.65,'The stone must retain substantial material');
assert.equal(largeChambers,0,'No sampled broad interior chamber should be present');
console.log(`PASS: ${openMouths} open mouths, deep channels, no sampled large chambers, ${(100*voidSamples/solidSamples).toFixed(1)}% removed volume`);
const smaller=makeField({...p,count:60,radius:1}),larger=makeField({...p,count:60,radius:1.5});
for(let i=0;i<smaller.tubes.length;i++)assert.ok(larger.tubes[i].radius>smaller.tubes[i].radius,'Radius changes must not silently hit a hard limit');
