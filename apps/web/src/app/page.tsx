import {getSiteDocument,isDraftPreview} from '@/lib/site-document';
import {getStores,getProducts,getPublishedPageByPath,orderUrl} from '@/lib/content';
import {PublishedPage} from '@/components/PublishedPage';
import {HomeView} from './WebsiteView';
export default async function Page(){
 const published=await getPublishedPageByPath('/');
 if(published)return <PublishedPage page={published}/>;
 const site=await getSiteDocument();
 return <HomeView initial={{...site,stores:await getStores(),products:await getProducts()}} editing={await isDraftPreview()} orderUrl={orderUrl}/>;
}
