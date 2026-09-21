import config from '../brand.json';

export interface BrandConfig {
  paymentMode?: 'simulated' | 'hitpay_sandbox';
  aboutHeroImage?: string;
  websiteLineupImage?: string;
  menuHeroImage?: string;
  homeBannerImage?: string; 
  homeBannerMobileImage?: string; 
  HeroImage3?: string;
  HeroImage4?: string;
  HeroImage5?: string;
  customerColors?:Record<string,string>; 
  headline?:{lead:string;accent:string}; 
  photoNote?:string; 
  showDemoBanner?:boolean; 
  secondaryHeroImage?:string; 
  heroImage:string; 
  heroImageAlt:string; 
  menuShortNote:string; 
  menuNote:string; 
  locationNote:string; 
  id:string; 
  name:string; 
  shortName:string; 
  initials:string; 
  tagline:string; 
  description:string; 
  locale:string; 
  currency:string; 
  timezone:string; 
  demo:boolean; 
  notice:string; 
  logo:string; 
  icon:string; 
  productPlaceholder:string; 
  storePlaceholder:string; 
  fonts:{body:string;display:string}; 
  colors:Record<string,string>; 
  urls:{website:string;order:string;admin:string;staff:string}; 
  contact:{email:string;phone:string;social:string[]} 
}

export const brand:BrandConfig = {...config, paymentMode: config.paymentMode === 'hitpay_sandbox' ? 'hitpay_sandbox' : 'simulated'};
export const money=(cents:number)=>new Intl.NumberFormat(brand.locale,{style:'currency',currency:brand.currency}).format(cents/100);
