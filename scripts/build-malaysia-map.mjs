import fs from 'node:fs';
const source=JSON.parse(fs.readFileSync('artifacts/malaysia-states-source.json'));
const names={'WP K Lumpur':'Kuala Lumpur','WP Putrajaya':'Putrajaya','WP Labuan':'Labuan','Pulau Pinang':'Penang'};
const labels={Perlis:[70,25],Kedah:[160,67],Penang:[65,115],Perak:[140,163],Kelantan:[290,60],Terengganu:[355,119],Pahang:[320,195],Selangor:[112,228],'Kuala Lumpur':[105,275],Putrajaya:[117,318],'Negeri Sembilan':[315,257],Melaka:[240,326],Johor:[340,367],Sarawak:[645,307],Sabah:[865,94],Labuan:[745,151]};
const project=([lon,lat])=>[(lon-99.5)*48+30,(7.5-lat)*55+20];
const data=source.features.map(f=>{
 const name=names[f.properties.name]||f.properties.name;
 const rings=(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates).flat();
 const pts=rings.flat().map(project),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 const center=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2];
 const path=rings.map(r=>{const p=r.map(project);let last=p[0];return p.filter((v,i)=>{if(!i||i===p.length-1||Math.hypot(v[0]-last[0],v[1]-last[1])>.8){last=v;return true}return false}).map((v,i)=>(i?'L':'M')+v.map(n=>n.toFixed(1)).join(',')).join('')+'Z'}).join('');
 return {name,path,center,label:labels[name],east:['Sabah','Sarawak','Labuan'].includes(name)};
});
fs.writeFileSync('apps/web/src/app/stores/malaysia-map.json',JSON.stringify(data));
console.log('Generated 16 state and territory shapes.');
