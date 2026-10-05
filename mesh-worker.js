import {buildStone} from './model.js?v=5';
onmessage=({data})=>{try {const result=buildStone(data);postMessage(result,Object.values(result).map(a=>a.buffer));} catch(e){postMessage({error:e.message});}};
