import fs from 'node:fs';
import path from 'node:path';
const brand=JSON.parse(fs.readFileSync('packages/brand/brand.json'));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const css=`:root{${Object.entries(brand.colors).map(([k,v])=>`--brand-${k}:${v}`).join(';')};--brand-initials:"${brand.initials}";--brand-body:${brand.fonts.body};--brand-display:${brand.fonts.display}}\n.demo-notice{padding:9px 16px;background:var(--brand-accent);color:var(--brand-deep);font:600 12px var(--brand-body);text-align:center} .demo-notice a{text-decoration:underline} ::selection{background:var(--brand-accent);color:var(--brand-deep)} :focus-visible{outline:3px solid var(--brand-accentInk);outline-offset:3px}\n`;
fs.writeFileSync('packages/brand/theme.css',css);
fs.writeFileSync('packages/brand/customer-theme.css',`:root{${Object.entries(brand.customerColors || brand.colors).map(([k,v])=>`--brand-${k}:${v}`).join(';')}}\n`);
const svg=(label,sub,w=512,h=512)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="24" fill="${brand.colors.cream}"/><text x="50%" y="46%" text-anchor="middle" fill="${brand.colors.primary}" font-family="Georgia,serif" font-size="${w/13}">${esc(label)}</text><text x="50%" y="58%" text-anchor="middle" fill="${brand.colors.muted}" font-family="Arial,sans-serif" font-size="${w/28}">${esc(sub)}</text></svg>`;
for(const app of ['web','order','admin','staff']){
 const appColors = ['web','order'].includes(app) ? (brand.customerColors || brand.colors) : brand.colors;
 const dir=`apps/${app}/public/brand`;fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(`${dir}/logo.svg`,svg(brand.name,'Demonstration wordmark'));
 fs.writeFileSync(`${dir}/icon.svg`,svg(brand.initials,'DEMO'));
 fs.writeFileSync(`${dir}/product-placeholder.svg`,svg('Photo coming soon','Illustrative menu · demo only'));
 fs.writeFileSync(`${dir}/store-placeholder.svg`,svg('Store photograph','Awaiting verified branch image',900,650));
 fs.writeFileSync(`apps/${app}/public/favicon.svg`,svg(brand.initials,'DEMO'));
 fs.writeFileSync(`apps/${app}/public/manifest.webmanifest`,JSON.stringify({id:`/${brand.id}-${app}`,name:`${brand.name} ${app}`,short_name:brand.shortName,start_url:'/',display:'standalone',background_color:appColors.cream,theme_color:appColors.primary,icons:[{src:brand.icon,sizes:'any',type:brand.icon.endsWith('.png')?'image/png':'image/svg+xml',purpose:'any'}]},null,2));
 const file=`apps/${app}/index.html`;if(fs.existsSync(file)){let s=fs.readFileSync(file,'utf8').replace(/<title>.*?<\/title>/,`<title>${esc(brand.name)} · ${app}</title>`);s=s.replace(/<link rel="icon"[^>]*>/,`<link rel="icon" href="${brand.icon}" />`).replace(/<meta name="theme-color"[^>]*>/,`<meta name="theme-color" content="${appColors.primary}" />`);if(!s.includes('manifest.webmanifest'))s=s.replace('</head>','<link rel="manifest" href="/manifest.webmanifest" /></head>');fs.writeFileSync(file,s);}
}
console.log('Synced brand theme, app metadata and labelled placeholders.');
