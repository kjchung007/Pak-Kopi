import fs from 'node:fs';
import ts from 'typescript';
if(fs.readFileSync('apps/web/src/app/page.tsx','utf8').includes('getSiteDocument'))throw new Error('The website content has already been extracted. Edit website-defaults.json instead.');
const copy={};
for(const [name,path] of Object.entries({home:'page.tsx',menu:'menu/page.tsx',story:'story/page.tsx',stores:'stores/page.tsx'})){
 const file='apps/web/src/app/'+path;let code=fs.readFileSync(file,'utf8');
 const ast=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const edits=[];let i=0;
 function visit(node){
  if(ts.isJsxText(node)&&node.text.trim()){
   const value=node.text.split(/\r?\n/).map((l,i,a)=>i===0?l.trimEnd():i===a.length-1?l.trimStart():l.trim()).filter(Boolean).join(' ');
   const key=name+'-'+(++i);copy[key]=value;
   edits.push({start:node.pos,end:node.end,text:`{site.copy[${JSON.stringify(key)}]}`});
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);for(const e of edits.reverse())code=code.slice(0,e.start)+e.text+code.slice(e.end);
 code="import { getSiteDocument } from '@/lib/site-document';\n"+code;
 code=code.replace(/(export default async function \w+\(\)\s*\{)/,'$1\n const site = await getSiteDocument();');
 for(const key of ['homeBannerImage','HeroImage4','HeroImage5','websiteLineupImage','menuHeroImage','aboutHeroImage'])code=code.replaceAll('src={brand.'+key,'src={site.images.'+key);
 if(name==='stores')code=code.replace('{brand.locationNote}','{site.copy["stores-description"]}');
 if(name==='home')code=code.replace('stores.filter(store => /Bandar Sandakan|Prima Sandakan/.test(store.name))','stores.filter(store => store.featured ?? /Bandar Sandakan|Prima Sandakan/.test(store.name))');
 fs.writeFileSync(file,code);
}
const brand=JSON.parse(fs.readFileSync('packages/brand/brand.json'));
copy['stores-description']=brand.locationNote;
fs.writeFileSync('packages/brand/website-defaults.json',JSON.stringify({schema:1,copy,images:Object.fromEntries(['homeBannerImage','HeroImage4','HeroImage5','websiteLineupImage','menuHeroImage','aboutHeroImage'].map(k=>[k,brand[k]])),stores:null,products:null},null,2));
