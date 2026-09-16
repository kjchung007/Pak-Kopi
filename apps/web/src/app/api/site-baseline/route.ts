import {getSiteDocument,previewServer} from '@/lib/site-document';
import {getProducts,getStores} from '@/lib/content';
export async function GET(){
 if(previewServer)return Response.json({error:'Use the live website baseline'},{status:403});
 const [doc,stores,products]=await Promise.all([getSiteDocument(),getStores(),getProducts()]);
 return Response.json({...doc,stores,products},{headers:{'Access-Control-Allow-Origin':'*','Cache-Control':'no-store'}});
}
