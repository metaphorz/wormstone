// Optional integration check: install Puppeteer in your development environment first.
import puppeteer from 'puppeteer';
import {spawn} from 'node:child_process';
const server=spawn('python3',['-m','http.server','8000','--bind','127.0.0.1'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,600));
let browser;
try {
browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage();await page.setViewport({width:1440,height:1080});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('faces'),{timeout:90000});
await page.screenshot({path:'validation/stone.png'});console.log('Stone:',await page.$eval('#status',e=>e.textContent));
await page.select('#surface','wire');await page.screenshot({path:'validation/wire.png'});
await page.click('[data-mode="sleeve"]');await page.click('#rings');await page.select('#surface','wet');await page.screenshot({path:'validation/sleeve.png'});
await page.click('[data-mode="2d"]');console.log('2D visible:',await page.$eval('#curve-frame',e=>!e.hidden));
await page.$eval('#radius',el=>{el.value=1.4;el.dispatchEvent(new Event('input',{bubbles:true}));});
console.log('Shared radius:',await page.$eval('#curve-frame',el=>el.contentDocument.querySelector('[data-id="radius"]').value));
await page.click('[data-mode="stone"]');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('faces'),{timeout:90000});
await page.select('#surface','dry');await page.setViewport({width:390,height:844});await page.screenshot({path:'validation/mobile.png',fullPage:true});
console.log('Errors:',JSON.stringify(errors));if(errors.length)process.exitCode=1;
}finally{await browser?.close();server.kill();}
