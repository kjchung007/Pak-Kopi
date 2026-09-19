import {getSiteDocument,isDraftPreview} from '@/lib/site-document';
import {getStores,getPublishedPageByPath,orderUrl} from '@/lib/content';
import {PublishedPage} from '@/components/PublishedPage';
import {StoresView} from './WebsiteView';
export const metadata={title:'Our branches'};
export default async function Page(){
 const published=await getPublishedPageByPath('/stores');
 if(published)return <PublishedPage page={published}/>;
 const site=await getSiteDocument();
 return <StoresView initial={{...site,stores:await getStores(),products:site.products||[]}} editing={await isDraftPreview()} orderUrl={orderUrl}/>;
}
