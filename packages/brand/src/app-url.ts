/** Ignore stale development addresses in deployed builds. */
export function appUrl(value:string|undefined,fallback:string,development:boolean){
 try{
  const url=new URL(value?.trim()||fallback);
  const local=/^(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname);
  if(!development&&(local||['3000','3001','5173','5174','5175'].includes(url.port)||url.protocol!=='https:'))return fallback;
  return url.href.replace(/\/$/,'');
 }catch{return fallback;}
}
