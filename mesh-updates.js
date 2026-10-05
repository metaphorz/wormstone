// Keep completed previews flowing while dragging; only refine the latest settings.
export class MeshUpdates {
 constructor({createWorker,onResult,onStart=()=>{},onError=()=>{},setTimer=(fn,delay)=>globalThis.setTimeout(fn,delay),clearTimer=id=>globalThis.clearTimeout(id)}) {
 Object.assign(this,{createWorker,onResult,onStart,onError,setTimer,clearTimer});
 this.revision=0;this.previewRevision=-1;this.finalRevision=-1;this.active=null;this.latest=null;
 }
 request(params){
 this.latest={...params};this.revision++;this.settled=false;
 this.clearTimer(this.timer);this.timer=this.setTimer(()=>this.refine(),240);
 // A fine mesh must never delay the next interactive preview.
 if(this.active&&!this.active.preview){this.active.worker.terminate();this.active=null;}
 this.pump();
 }
 refine(){this.clearTimer(this.timer);this.settled=true;this.pump();}
 pump(){
 if(this.active||!this.latest)return;
 const preview=!this.settled;
 if((preview?this.previewRevision:this.finalRevision)===this.revision)return;
 const params={...this.latest},revision=this.revision;
 if(preview)params.resolution=Math.min(params.resolution,params.count>600?112:72);
 const worker=this.createWorker(),job={worker,preview,params,revision};this.active=job;
 this.onStart(job);
 worker.onmessage=({data})=>{
 if(this.active!==job)return;
 worker.terminate();this.active=null;
 if(data.error){this.onError(data.error);this.latest=null;return;}
 if(preview)this.previewRevision=revision;else this.finalRevision=revision;
 this.onResult(data,{...job,current:revision===this.revision});
 this.pump();
 };
 worker.onerror=()=>{if(this.active!==job)return;worker.terminate();this.active=null;this.latest=null;this.onError('Could not build mesh. Serve this folder over HTTP.');};
 worker.postMessage(params);
 }
 cancel(){this.clearTimer(this.timer);this.active?.worker.terminate();this.active=null;this.latest=null;}
}
