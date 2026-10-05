import {triTable} from './vendor/marching-tables.js';
// The seeded Fourier model is shared with the original Random Curve Lab.
export const TAU = 2 * Math.PI;
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function curve(p) {
 const rand = rng(p.seed >>> 0), c = Array.from({length:24},()=>({q:.2+.8*rand(),phase:TAU*rand()}));
 const w=c.slice(0,p.terms).map((v,i)=>v.q/(i+1)**p.smooth), sum=w.reduce((a,b)=>a+b,0);
 return t=>p.radius*(1+w.reduce((s,v,i)=>s+p.rough*v/sum*Math.cos((i+1)*t+c[i].phase),0));
}
export function tubePoint(p, t, z, outer=0) {
 const r=curve(p)(t+p.twist*z*.45)*.27*(1+.1*Math.sin(z*2.4)) + outer;
 return [Math.cos(t)*r+p.bend*.16*Math.sin(z*1.5), z, Math.sin(t)*r+p.bend*.12*Math.cos(z*1.8)];
}
export function makeField(p) {
 const rand=rng(p.seed+901), r=curve(p), table=Array.from({length:513},(_,i)=>r(i/512*TAU)/p.radius);
 const rotation=rand()*TAU;
 function outer(x,y,z) {const shape=Math.sqrt((x/2.1)**2+(y/1.16)**2+(z/1.65)**2);return (shape-1)*1.25+p.weather*(.10*Math.sin(x*3+y*2)*Math.cos(z*3-y)+.045*Math.sin(x*8+z*5)*Math.sin(y*7-z*3));}
 // Distribute mouths over the actual skin and extend narrow bores deeply
 // inward. A nearest-channel wall prevents neighboring voids forming chambers.
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 const unit=a=>{const n=Math.hypot(...a);return a.map(v=>v/n);};
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const placed=[];
 const tubes=Array.from({length:p.count},()=>{
 // Select from a few area-weighted random candidates: close packed without rows.
 let centerCandidate,best=-1;
 for(let candidate=0;candidate<3;candidate++){
 let y,a,d;do{y=2*rand()-1;a=rand()*TAU;d=Math.sqrt(1-y*y);}while(rand()>Math.sqrt((d*Math.cos(a)/2.1)**2+(y/1.16)**2+(d*Math.sin(a)/1.65)**2)*1.16);
 const ray=[2.1*d*Math.cos(a),1.16*y,1.65*d*Math.sin(a)];
 let lo=.6,hi=1.4;for(let j=0;j<24;j++){const m=(lo+hi)/2;if(outer(...ray.map(v=>v*m))>0)hi=m;else lo=m;}
 const q=ray.map(v=>v*(lo+hi)/2);let nearest=Infinity;
 for(const prev of placed){const dist=(q[0]-prev[0])**2+(q[1]-prev[1])**2+(q[2]-prev[2])**2;nearest=Math.min(nearest,dist);}
 if(nearest>best){best=nearest;centerCandidate=q;}
 }
 placed.push(centerCandidate);
 const center=centerCandidate,eps=.002;
 const normal=unit(center.map((_,k)=>{const a=[...center],b=[...center];a[k]+=eps;b[k]-=eps;return outer(...a)-outer(...b);}));
 // Keep entry directions close to the surface normal, avoiding exposed trenches.
 const inward=unit(center.map((v,k)=>-.2*normal[k]-.8*v/Math.hypot(...center)));
 const u=unit(cross(inward,Math.abs(inward[1])<.9?[0,1,0]:[1,0,0])),v=cross(inward,u);
 return {center,axis:inward,u,v,phase:rand()*TAU,scale:.65+.8*rand(),depth:Math.hypot(...center)*(.72+.40*rand())};
 });
 for(const t of tubes){const spacing=Math.min(.45,...tubes.filter(q=>q!==t).map(q=>Math.hypot(...t.center.map((v,k)=>v-q.center[k]))));t.spacing=spacing;t.radius=spacing*(.36+.24*(1-Math.exp(-2*p.radius*t.scale)))*(.85+.2*t.scale);}
 const cell=.24,key=(x,y,z)=>x+','+y+','+z,bins=new Map();
 for(const t of tubes){
 const occupied=new Set(),bound=t.radius*Math.max(...table)*1.08;
 for(let h=-.15;h<=t.depth+.15;h+=cell*.5){const point=t.center.map((v,k)=>v+t.axis[k]*h),span=Math.ceil(bound/cell)+1;
 const q=point.map(v=>Math.floor(v/cell));for(let x=-span;x<=span;x++)for(let y=-span;y<=span;y++)for(let z=-span;z<=span;z++)occupied.add(key(q[0]+x,q[1]+y,q[2]+z));}
 for(const k of occupied){if(!bins.has(k))bins.set(k,[]);bins.get(k).push(t);}
 }
 function channelCenter(t,h){return t.center.map((v,k)=>v+t.axis[k]*h);}
 const wall=.020;
 return {outer,tubes,channelCenter,wall,field(x,y,z) {
 let f=outer(x,y,z);if(f>.05||!tubes.length)return f;
 const nearby=bins.get(key(Math.floor(x/cell),Math.floor(y/cell),Math.floor(z/cell)))||[];
 let first=Infinity,second=Infinity,nearest,nu=0,nv=0,nh=0;
 for(const t of nearby){
 const delta=[x-t.center[0],y-t.center[1],z-t.center[2]],h=dot(delta,t.axis);
 if(h<-.2||h>t.depth)continue;
 const u=dot(delta,t.u)-p.bend*.015*Math.sin(h*2+t.phase)*Math.min(1,Math.max(0,h)*4),v=dot(delta,t.v),distance=u*u+v*v;
 if(distance<first){second=first;first=distance;nearest=t;nu=u;nv=v;nh=h;}else if(distance<second)second=distance;
 }
 if(!nearest)return f;
 const distance=Math.sqrt(first),angle=((Math.atan2(nv,nu)+p.twist*nh*.45+nearest.phase)%TAU+TAU)%TAU/TAU*512,j=Math.floor(angle);
 const profile=table[j]+(table[j+1]-table[j])*(angle-j),radial=profile*nearest.radius*(1+.08*Math.sin(nh*3+nearest.phase));
 const partition=(Math.sqrt(second)-distance-wall)*.5;
 return Math.max(f,Math.min(radial-distance,partition,nearest.depth-nh));
 }};
}
// Marching cubes extracts the actual solid/void boundary, including channel walls.
export function buildStone(p) {
 const n=p.resolution, span=5.4, step=span/n, side=n+1, total=side**3;
 const values=new Float32Array(total), {field,outer}=makeField(p), at=(x,y,z)=>x+side*(y+side*z);
 for(let z=0;z<=n;z++)for(let y=0;y<=n;y++)for(let x=0;x<=n;x++)values[at(x,y,z)]=field(x*step-span/2,y*step-span/2,z*step-span/2);
 const pos=[], normals=[], cavity=[];
 const offsets=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
 const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
 const grad=(x,y,z)=>[values[at(Math.min(n,x+1),y,z)]-values[at(Math.max(0,x-1),y,z)],values[at(x,Math.min(n,y+1),z)]-values[at(x,Math.max(0,y-1),z)],values[at(x,y,Math.min(n,z+1))]-values[at(x,y,Math.max(0,z-1))]];
 for(let z=0;z<n;z++)for(let y=0;y<n;y++)for(let x=0;x<n;x++) {
 const vs=offsets.map(o=>values[at(x+o[0],y+o[1],z+o[2])]); if(vs.every(v=>v>=0)||vs.every(v=>v<0))continue;
 const points=offsets.map(o=>[(x+o[0])*step-span/2,(y+o[1])*step-span/2,(z+o[2])*step-span/2]);
 const gs=offsets.map(o=>grad(x+o[0],y+o[1],z+o[2]));
 function edge(a,b){const t=vs[a]/(vs[a]-vs[b]);return {p:points[a].map((v,k)=>v+t*(points[b][k]-v)),g:gs[a].map((v,k)=>v+t*(gs[b][k]-v))};}
 function tri(a,b,c){for(const v of [a,b,c]){const len=Math.hypot(...v.g)||1;v.g=v.g.map(q=>q/len);}const ab=b.p.map((v,k)=>v-a.p[k]),ac=c.p.map((v,k)=>v-a.p[k]);const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
 if(cross.reduce((s,v,k)=>s+v*(a.g[k]+b.g[k]+c.g[k]),0)<0)[b,c]=[c,b];
 for(const v of [a,b,c]){pos.push(...v.p);const len=Math.hypot(...v.g)||1;normals.push(...v.g.map(q=>q/len));cavity.push(Math.max(.35,1+outer(...v.p)*1.35));}}
 const mask=vs.reduce((bits,v,i)=>bits|(v<0?1<<i:0),0),cache=[];
 for(let j=0;j<16&&triTable[mask*16+j]!==-1;j+=3){
 const triangle=[];for(let k=0;k<3;k++){const id=triTable[mask*16+j+k];if(!cache[id])cache[id]=edge(...edges[id]);triangle.push(cache[id]);}tri(...triangle);
 }

 }
 return {positions:new Float32Array(pos),normals:new Float32Array(normals),cavity:new Float32Array(cavity)};
}
