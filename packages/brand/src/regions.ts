export const malaysiaStates=['Johor','Kedah','Kelantan','Kuala Lumpur','Labuan','Melaka','Negeri Sembilan','Pahang','Penang','Perak','Perlis','Putrajaya','Sabah','Sarawak','Selangor','Terengganu'];
export function normalizeState(value?:string){
 const text=(value||'').trim().replace(/^W\.?P\.?\s*/i,'').replace(/^Wilayah Persekutuan\s*/i,'');
 const aliases:Record<string,string>={'pulau pinang':'Penang','malacca':'Melaka','kl':'Kuala Lumpur'};
 return aliases[text.toLowerCase()]||malaysiaStates.find(s=>s.toLowerCase()===text.toLowerCase())||text;
}
