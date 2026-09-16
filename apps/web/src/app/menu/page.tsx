import {getSiteDocument,isDraftPreview} from '@/lib/site-document';
import {getStores,getProducts,getPublishedPageByPath,orderUrl} from '@/lib/content';
import {PublishedPage} from '@/components/PublishedPage';
import {MenuView} from './WebsiteView';
export const metadata={title:'Menu'};
export default async function Page(){
 const published=await getPublishedPageByPath('/menu');
 if(published)return <PublishedPage page={published}/>;
 const site=await getSiteDocument();
 return <MenuView initial={{...site,stores:await getStores(),products:await getProducts()}} editing={await isDraftPreview()} orderUrl={orderUrl}/>;
}
