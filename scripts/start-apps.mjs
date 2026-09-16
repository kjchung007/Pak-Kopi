import {spawn} from 'node:child_process';
import path from 'node:path';
const children=[];
for(const [app,port]of [['web',3000],['web',3001],['order',5173],['admin',5174],['staff',5175]]){
 const cwd=path.resolve('apps',app);
 const script=app==='web'?'node_modules/next/dist/bin/next':'node_modules/vite/bin/vite.js';
 const host=['web','order'].includes(app)?'0.0.0.0':'127.0.0.1';
 const args=app==='web'?[script,'dev','--port',String(port),'--hostname',host]:[script,'--host',host,'--port',String(port),'--strictPort'];
 const child=spawn(process.execPath,args,{cwd,env:{...process.env,...(port===3001?{WEBSITE_DRAFT_PREVIEW:'true'}:{})},stdio:'inherit',windowsHide:true});children.push(child);
 child.on('exit',code=>{if(code)console.error(app,'exited with',code)});
}
function stop(){children.forEach(c=>c.kill());process.exit()}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
