import defaults from '../website-defaults.json';
export type WebsiteStore={id:number;name:string;address:string;phone:string;opening:string;closing:string;image?:string;acceptingPickup?:boolean;featured?:boolean};
export type WebsiteProduct={id:number;name:string;description:string;priceCents:number;image:string;category:string};
export type SiteDocument={schema:number;copy:Record<string,string>;images:Record<string,string>;stores:WebsiteStore[]|null;products:WebsiteProduct[]|null};
export const defaultSite:SiteDocument=defaults;
