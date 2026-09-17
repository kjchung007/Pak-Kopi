import shapes from './malaysia-map.json';
export function MalaysiaMap({selected,onSelect}:{selected:string;onSelect:(state:string)=>void}){
 const render=(east:boolean)=><svg viewBox={east?'480 0 540 420':'0 0 450 420'} aria-label={east?'East Malaysia states':'Peninsular Malaysia states'} role="group">
  {shapes.filter(s=>s.east===east).map(s=><path key={s.name} d={s.path} className={selected===s.name?'selected':''} onClick={()=>onSelect(s.name)}><title>{s.name}</title></path>)}
  {shapes.filter(s=>s.east===east).map(s=><g key={s.name} role="button" tabIndex={0} aria-label={`Show stores in ${s.name}`} aria-pressed={selected===s.name} className={`map-label ${selected===s.name?'selected':''}`} onClick={()=>onSelect(s.name)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(s.name)}}}>
   <line x1={s.center[0]} y1={s.center[1]} x2={s.label[0]} y2={s.label[1]}/><circle cx={s.center[0]} cy={s.center[1]} r="3"/>
   <rect x={s.label[0]-Math.max(44,s.name.length*4.3)} y={s.label[1]-16} width={Math.max(88,s.name.length*8.6)} height="32" rx="16"/>
   <text x={s.label[0]} y={s.label[1]+1} textAnchor="middle" dominantBaseline="middle">{s.name}</text>
  </g>)}
 </svg>;
 return <div className="malaysia-map">{render(false)}{render(true)}</div>;
}
