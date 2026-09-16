import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--port','3001','--hostname','0.0.0.0'],{cwd:'apps/web',env:{...process.env,WEBSITE_DRAFT_PREVIEW:'true'},stdio:'inherit',windowsHide:true});
process.on('SIGINT',()=>child.kill());process.on('SIGTERM',()=>child.kill());
child.on('exit',code=>process.exit(code??0));
