import {getSiteDocument,isDraftPreview} from '@/lib/site-document';
import {getPublishedPageByPath,orderUrl} from '@/lib/content';
import {PublishedPage} from '@/components/PublishedPage';
import {StoryView} from './WebsiteView';
export const metadata={title:'About Pak Kopi 1969'};
export default async function Page(){
 const published=await getPublishedPageByPath('/story');
 if(published)return <PublishedPage page={published}/>;
 const site=await getSiteDocument();
 return <StoryView initial={{...site,stores:site.stores||[],products:site.products||[]}} editing={await isDraftPreview()} orderUrl={orderUrl}/>;
}
