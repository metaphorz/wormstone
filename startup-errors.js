// Show startup failures instead of leaving the specimen preparation label forever.
(() => {
 const report=message=>{
 const status=document.getElementById('status');
 if(status){status.textContent='App error: '+message;status.setAttribute('role','alert');}
 };
 window.addEventListener('error',event=>{
 if(event.message)report(event.message);
 else if(event.target instanceof HTMLScriptElement)report('Could not load '+event.target.getAttribute('src')+'. Refresh the page.');
 },true);
 window.addEventListener('unhandledrejection',event=>report(event.reason?.message||String(event.reason)));
})();
