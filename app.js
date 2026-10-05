import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {tubePoint} from './model.js?v=5';
import {MeshUpdates} from './mesh-updates.js?v=5';
const $=id=>document.getElementById(id);
const defaults={seed:42,radius:1,rough:.65,terms:7,smooth:1.2,count:2400,bend:.65,twist:.7,weather:.5,resolution:256};
let p={...defaults}, mode='stone',stoneData,dirty=true;
const fields=[['radius','Mean radius',.5,2,.05],['rough','Irregularity',0,.95,.01],['terms','Harmonics',1,24,1],['smooth','Smoothness',0,3,.1],['count','Passages',0,4000,1],['bend','Tube drift',0,1.5,.05],['twist','Tube twist',0,2,.05],['weather','Stone irregularity',0,1.5,.05]];
fields.forEach(([id,label,min,max,step],i)=>{const el=document.createElement('label');el.className='field';el.innerHTML=`<span>${label}<output id="out-${id}">${p[id]}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${p[id]}">`;$ (i<4?'profile-controls':'stone-controls').append(el);$(id).oninput=()=>{p[id]=+$(id).value;$('out-'+id).textContent=p[id];changed();};});
function syncFrame(){const doc=$('curve-frame').contentDocument;if(!doc?.getElementById('curve-lab'))return;for(const id of ['seed','radius','rough','terms','smooth'])doc.querySelector(`[data-id="${id}"]`).value=p[id];doc.querySelector('[data-id="seed"]').dispatchEvent(new CustomEvent('input',{detail:{fromParent:true}}));}
$('curve-frame').addEventListener('load',syncFrame);
window.addEventListener('message',e=>{if(e.source!==$('curve-frame').contentWindow||e.origin!==location.origin||e.data?.type!=='curve-change')return;const next=e.data.params;if(!['seed','radius','rough','terms','smooth'].some(k=>p[k]!==next[k]))return;Object.assign(p,next);syncInputs();changed(false);});
function syncInputs(){for(const [id] of fields){$(id).value=p[id];$('out-'+id).textContent=p[id];}$('seed').value=p.seed;$('resolution').value=p.resolution;}
function changed(sync=true){dirty=true;if(sync)syncFrame();if(mode==='stone')build();else if(mode==='sleeve')showSleeve();updateLabel();}
$('seed').oninput=()=>{if(!$('seed').checkValidity())return;p.seed=+$('seed').value;changed();};
$('random').onclick=()=>{p.seed=crypto.getRandomValues(new Uint32Array(1))[0];syncInputs();changed();};
$('resolution').onchange=()=>{p.resolution=+$('resolution').value;changed();};
$('reset').onclick=()=>{p={...defaults};syncInputs();changed();};
$('about').onclick=()=>{$('notes').open=!$('notes').open;if($('notes').open)$('notes').scrollIntoView({behavior:'smooth'});};
const scene=new THREE.Scene();scene.background=new THREE.Color('#e8ebe2');scene.fog=new THREE.Fog('#e8ebe2',15,32);
const camera=new THREE.PerspectiveCamera(35,1,.05,60);camera.position.set(2.8,3.0,6.8);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}catch(e){$('status').textContent='WebGL unavailable — 2D profile is still available';$('viewport').innerHTML='<p style="padding:90px 30px">This browser could not start WebGL. Use the 2D profile tab or open this page in a browser with hardware acceleration.</p>';}
let controls,object=new THREE.Group(),guides=new THREE.Group();scene.add(object,guides);
const key=new THREE.DirectionalLight(0xfff5e9,3),fill=new THREE.DirectionalLight(0xd4e5ed,.8),rim=new THREE.DirectionalLight(0xfff5df,1.2);
key.position.set(-3,7,5);fill.position.set(5,2,2);rim.position.set(0,4,-5);scene.add(key,fill,rim,new THREE.HemisphereLight(0xe8eee9,0x716249,.75));
key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:20});key.shadow.bias=-.0003;key.shadow.normalBias=.025;key.shadow.radius=3;
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0xe0e4d9,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.48;floor.receiveShadow=true;scene.add(floor);
const material=new THREE.MeshStandardMaterial({color:0xc7b99b,roughness:.94,vertexColors:true});
// Object-space procedural texture avoids stretched UV seams on irregular cavities.
material.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 stonePosition;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nstonePosition = position;');
 shader.fragmentShader='varying vec3 stonePosition;\nuniform float wetness;\nfloat hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}\nfloat noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}\n'+shader.fragmentShader;
 shader.uniforms.wetness={value:$('surface').value==='wet'?1:0};material.userData.shader=shader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float mineral=noise3(stonePosition*5.)*.5+noise3(stonePosition*18.)*.3+noise3(stonePosition*65.)*.2;
 float grain=noise3(stonePosition*175.);float pits=smoothstep(.24,.4,grain);
 diffuseColor.rgb *= mix(vec3(.63,.57,.45),vec3(1.12,1.09,1.02),mineral)*mix(.77,1.04,pits)*(1.-wetness*.2);`);
 shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 float height=noise3(stonePosition*95.)*.005+noise3(stonePosition*28.)*.012;
 vec3 q0=dFdx(vViewPosition),q1=dFdy(vViewPosition);vec3 s0=cross(q1,normal),s1=cross(normal,q0);
 float determinant=dot(q0,s0);normal=normalize(abs(determinant)*normal-sign(determinant)*(dFdx(height)*s0+dFdy(height)*s1)*.55);`);
};
const clay=new THREE.MeshStandardMaterial({color:0xd2cec1,roughness:1});
const wire=new THREE.MeshBasicMaterial({color:0x41675c,wireframe:true,transparent:true,opacity:.3});
const wireDepth=new THREE.MeshBasicMaterial({colorWrite:false,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
const dots=new THREE.PointsMaterial({color:0x214c3e,size:.005,sizeAttenuation:true});
function clear(group){while(group.children.length){const child=group.children.pop();child.geometry?.dispose();child.parent=null;}}
function geometry(data){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(data.positions,3));g.setAttribute('normal',new THREE.BufferAttribute(data.normals,3));const colors=new Float32Array(data.positions.length);for(let i=0;i<colors.length;i++)colors[i]=data.cavity?.[Math.floor(i/3)]??1;g.setAttribute('color',new THREE.BufferAttribute(colors,3));return g;}
function display(data){clear(object);if(!data.positions.length){floor.visible=false;return;}const g=geometry(data);if($('surface').value==='wire'){const depth=new THREE.Mesh(g,wireDepth),lines=new THREE.Mesh(g,wire);depth.renderOrder=0;lines.renderOrder=1;const pointGeometry=new THREE.BufferGeometry();pointGeometry.setAttribute('position',g.attributes.position);const stride=Math.max(1,Math.ceil(g.attributes.position.count/18000));pointGeometry.setIndex(Array.from({length:Math.ceil(g.attributes.position.count/stride)},(_,i)=>i*stride));const points=new THREE.Points(pointGeometry,dots);points.renderOrder=2;object.add(depth,lines,points);floor.visible=false;}else{const m=$('surface').value==='clay'?clay:material;const mesh=new THREE.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;object.add(mesh);floor.visible=true;}g.computeBoundingBox();floor.position.y=g.boundingBox.min.y-.018;updateMaterial();}
const meshUpdates=new MeshUpdates({
 createWorker:()=>new Worker('./mesh-worker.js?v=5',{type:'module'}),
 onStart:({preview,params})=>{if(mode==='stone')$('status').textContent=preview?'Updating live preview…':`${params.count} passages · refining surface…`;},
 onResult:(data,{preview,current,params})=>{
 stoneData=data;dirty=preview||!current;$('viewport').dataset.renderedCount=String(params.count);$('viewport').dataset.preview=String(preview);
 if(mode==='stone'){display(data);$('status').textContent=data.positions.length?`${params.count} passages · ${preview?'live preview':Math.round(data.positions.length/9).toLocaleString()+' faces'}`:'No stone remains — reduce radius or passages';}
 },
 onError:message=>{$('status').textContent=message;}
});
function build(){if(renderer)meshUpdates.request(p);}
for(const [id] of fields)$(id).addEventListener('change',()=>{if(mode==='stone')meshUpdates.refine();});

let sleeveData;
function showSleeve(){const positions=[],normals=[],segments=112,levels=70;
 const add=(a,b,c)=>positions.push(...a,...b,...c);
 for(let j=0;j<levels;j++)for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2,y=j/levels*2.8-1.4,z=(j+1)/levels*2.8-1.4;
 for(const outer of [0,.075]){const A=tubePoint(p,a,y,outer),B=tubePoint(p,b,y,outer),C=tubePoint(p,a,z,outer),D=tubePoint(p,b,z,outer);if(outer){add(A,C,B);add(B,C,D);}else{add(A,B,C);add(B,D,C);}}
 if(j===0||j===levels-1){const h=j===0?y:z,A=tubePoint(p,a,h),B=tubePoint(p,b,h),C=tubePoint(p,a,h,.075),D=tubePoint(p,b,h,.075);if(j===0){add(A,C,B);add(B,C,D);}else{add(A,B,C);add(B,D,C);}}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();sleeveData={positions:g.attributes.position.array,normals:g.attributes.normal.array};g.dispose();display(sleeveData);clear(guides);
 for(let j=0;j<=14;j++){const pts=Array.from({length:113},(_,i)=>new THREE.Vector3(...tubePoint(p,i/112*Math.PI*2,j/14*2.8-1.4,.079)));guides.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),guideMaterial));}
 guides.visible=$('rings').checked;$('status').textContent='One continuous, hollow sleeve';}
const guideMaterial=new THREE.LineBasicMaterial({color:0x437f72});
function updateMaterial(){const wet=$('surface').value==='wet';material.roughness=wet?.27:.94;material.metalness=0;material.color.set(wet?0x817d70:0xa5a18f);if(material.userData.shader)material.userData.shader.uniforms.wetness.value=wet?1:0;}
function updateLabel(){$('specimen-label').textContent=`${mode==='stone'?'POROUS LIMESTONE':mode==='sleeve'?'SINGLE SLEEVE':'FOURIER HOLE PROFILE'} / ${String(p.seed).padStart(4,'0')}`;}
function resetView(){if(!controls)return;camera.position.set(...(mode==='sleeve'?[2.4,2.6,4.1]:[2.8,3.0,6.8]));controls.target.set(0,0,0);controls.update();}
for(const button of document.querySelectorAll('[data-mode]'))button.onclick=()=>{mode=button.dataset.mode;if(mode!=='stone')meshUpdates.cancel();document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b===button));$('curve-frame').hidden=mode!=='2d';$('viewport').hidden=mode==='2d';$('gesture').textContent=mode==='2d'?'Adjust the profile here or in the original curve lab':'Drag to orbit · Scroll to zoom · Right-drag to pan';for(const id of ['surface','wire-toggle','lighting','exposure','rotate','home'])$(id).disabled=mode==='2d';$('rings').disabled=mode!=='sleeve';guides.visible=mode==='sleeve'&&$('rings').checked;if(mode==='stone'){if(dirty||!stoneData)build();else{display(stoneData);$('status').textContent=stoneData.positions.length?`${p.count} passages · ${Math.round(stoneData.positions.length/9).toLocaleString()} faces`:'No stone remains — reduce radius or passages';}}else if(mode==='sleeve')showSleeve();else $('status').textContent='Original seeded curve model';updateLabel();resetView();};
$('rings').disabled=true;$('rings').onchange=()=>guides.visible=mode==='sleeve'&&$('rings').checked;
let lastShadedSurface='dry';
$('wire-toggle').onclick=()=>{$('surface').value=$('surface').value==='wire'?lastShadedSurface:'wire';$('surface').dispatchEvent(new Event('change'));};
$('surface').onchange=()=>{const isWire=$('surface').value==='wire';$('wire-toggle').setAttribute('aria-pressed',String(isWire));if(!isWire)lastShadedSurface=$('surface').value;$('gesture').textContent=isWire?'Unshaded mesh · Zoom in to inspect the fine triangles':'Drag to orbit · Scroll to zoom · Right-drag to pan';if(mode==='stone'&&stoneData)display(stoneData);else if(mode==='sleeve')display(sleeveData);};
$('lighting').onchange=()=>{const preset=$('lighting').value;if(preset==='studio'){key.position.set(-3,7,5);key.intensity=3;fill.intensity=.8;rim.intensity=1.2;key.color.set(0xfff5e9);}else if(preset==='coast'){key.position.set(-5,8,-1);key.intensity=4;fill.intensity=1.6;rim.intensity=.8;key.color.set(0xffe7bd);}else{key.position.set(-5,2.5,3);key.intensity=4;fill.intensity=.25;rim.intensity=2.8;key.color.set(0xffdfb4);}};$('lighting').onchange();
$('exposure').oninput=()=>{if(renderer)renderer.toneMappingExposure=+$('exposure').value;};$('home').onclick=resetView;
function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.click();}
$('save').onclick=()=>{if(mode==='2d'){const svg=$('curve-frame').contentDocument.querySelector('svg').cloneNode(true);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('style','--foreground:#243330;--border:#dce3df;--viz-series-1:#087f78');const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));download(url,`wormstone-profile-${p.seed}.svg`);setTimeout(()=>URL.revokeObjectURL(url),1000);}else if(renderer){renderer.render(scene,camera);download(renderer.domElement.toDataURL('image/png'),`wormstone-${mode}-${p.seed}.png`);}};
if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;$('viewport').append(renderer.domElement);controls=new OrbitControls(camera,renderer.domElement);renderer.domElement.addEventListener('pointerdown',()=>{$('rotate').checked=false;});controls.enableDamping=true;controls.minDistance=1.1;controls.maxDistance=18;controls.maxPolarAngle=Math.PI*.88;new ResizeObserver(()=>{const {width,height}=$('viewport').getBoundingClientRect();if(width&&height){renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}}).observe($('viewport'));
let previous=performance.now();renderer.setAnimationLoop(now=>{const dt=Math.min((now-previous)/1000,.1);previous=now;if(mode==='2d'||document.hidden)return;controls.autoRotate=$('rotate').checked;controls.autoRotateSpeed=1;controls.update(dt);renderer.render(scene,camera);});build();}updateLabel();
