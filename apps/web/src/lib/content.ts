import {appUrl} from '@coffee/brand/app-url';
import { brand } from '@coffee/brand';
import catalog from '@coffee/brand/catalog';
import {getSiteDocument} from './site-document';
import type {WebsiteStore} from '@coffee/brand/website';
import {normalizeState} from '@coffee/brand/regions';
export type Product = { id: number; name: string; description: string; priceCents: number; image: string; category: string };
export type Store = WebsiteStore;
export type Campaign = { id: number; title: string; body: string; image: string };
export type WebsiteSection = { id:string; type:"hero"|"text_image"|"rich_text"|"call_to_action"|"product_catalog"|"store_list"; heading:string; body:string; imageUrl?:string; buttonLabel?:string; buttonUrl?:string; background?:"navy"|"cream"|"white"|"gold"; align?:"left"|"center"; imagePositionX?:number; imagePositionY?:number; imageHeight?:number };
export type WebsitePage = { id:number; title:string; slug:string; routePath:string; seoTitle:string; seoDescription:string; sections:WebsiteSection[] };

// The publishable key is safe in website code; RLS remains the authorization boundary.
// Each client supplies its own backend. Offline previews use the local catalogue.
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim();
const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY)?.trim();

async function rest<T>(table: string, params: Record<string, string>): Promise<T[]> {
  if (!url || !key) return [];
  const endpoint = new URL(`${url}/rest/v1/${table}`);
  Object.entries(params).forEach(([name, value]) => endpoint.searchParams.set(name, value));
  try {
    const response = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` }, ...(table==='stores'?{cache:'no-store' as const}:{next:{revalidate:60}}), signal: AbortSignal.timeout(6000) });
    return response.ok ? await response.json() as T[] : [];
  } catch { return []; }
}

const fallbackProducts:Product[] = catalog.products;

export async function getProducts(): Promise<Product[]> {
  const site=await getSiteDocument();if(site.products!==null)return site.products;
  type Row = { id:number; name:string; description:string|null; price_cents:number; image_url:string|null; categories:{name:string}|{name:string}[]|null };
  const rows = await rest<Row>("products", { select: "id,name,description,price_cents,image_url,categories(name)", available: "eq.true", order: "sort_order.asc" });
  if (!rows.length) return fallbackProducts;
  return rows.map((row) => ({ id: row.id, name: row.name, description: row.description || "Made fresh for your next coffee break.", priceCents: row.price_cents, image: row.image_url || fallbackProducts.find((item) => item.name === row.name)?.image || brand.productPlaceholder, category: Array.isArray(row.categories) ? row.categories[0]?.name || "Menu" : row.categories?.name || "Menu" }));
}

export async function getStores(): Promise<Store[]> {
  const site=await getSiteDocument();
  type Row = {state:string;city:string;latitude:number|null;longitude:number|null;maps_url:string|null; accepting_pickup:boolean; image_url:string|null; id:number; name:string; address:string|null; phone:string|null; opening_time:string|null; closing_time:string|null };
  const rows = await rest<Row>("stores", { select: "id,name,address,phone,opening_time,closing_time,image_url,maps_url,accepting_pickup,state,city,latitude,longitude", active: "eq.true", order: "name.asc" });
    const live:Store[]=rows.map(row=>({state:normalizeState(row.state),city:row.city,latitude:row.latitude,longitude:row.longitude,mapsUrl:row.maps_url||undefined,acceptingPickup:row.accepting_pickup,image:row.image_url||brand.storePlaceholder,id:row.id,name:row.name,address:row.address||'',phone:row.phone||'',opening:row.opening_time||'00:00',closing:row.closing_time||'00:00'}));
    if (site.stores !== null) {
      const editorialById = new Map(site.stores.map((store) => [store.id, store]));
      const merged = live.map((store) => ({
        ...store,
        ...editorialById.get(store.id),
        state: normalizeState(editorialById.get(store.id)?.state || store.state),
      }));
      const liveIds = new Set(live.map((store) => store.id));
      const editorialOnly = site.stores.filter((store) => !liveIds.has(store.id));
      return [...merged, ...editorialOnly.map((store) => ({
        ...store,
        state: normalizeState(store.state || (/Sabah/i.test(store.address) ? 'Sabah' : '')),
      }))];
    }
  if(live.length||url)return live;
  return catalog.stores.map(s=>({...s,state:'Sabah',acceptingPickup:s.acceptingPickup??true,phone:'',opening:'00:00',closing:'00:00'}));
}

export async function getCampaigns(): Promise<Campaign[]> {
  type Row = { id:number; title:string; body:string|null; image_url:string|null };
  const rows = await rest<Row>("campaigns", { select:"id,title,body,image_url", active:"eq.true", order:"sort_order.asc", limit:"3" });
  return rows.map((row) => ({ id:row.id, title:row.title, body:row.body || brand.tagline, image:row.image_url || brand.productPlaceholder }));
}

export async function getPublishedPage(slug:string): Promise<WebsitePage | null> {
  type Row = { id:number; title:string; slug:string; route_path:string; seo_title:string; seo_description:string; published_content:{sections?:WebsiteSection[]} };
  const rows = await rest<Row>("website_published", {
    select:"id,title,slug,route_path,seo_title,seo_description,published_content",
    slug:`eq.${slug}`,
    published_content:"not.is.null",
    limit:"1",
  });
  const row = rows[0];
  if (!row) return null;
  return { id:row.id, title:row.title, slug:row.slug, routePath:row.route_path, seoTitle:row.seo_title, seoDescription:row.seo_description, sections:Array.isArray(row.published_content?.sections) ? row.published_content.sections : [] };
}

export async function getPublishedPageByPath(routePath:string): Promise<WebsitePage | null> {
  type Row = { id:number; title:string; slug:string; route_path:string; seo_title:string; seo_description:string; published_content:{sections?:WebsiteSection[]} };
  const rows = await rest<Row>("website_published", { select:"id,title,slug,route_path,seo_title,seo_description,published_content", route_path:`eq.${routePath}`, published_content:"not.is.null", limit:"1" });
  const row=rows[0]; if(!row) return null;
  return { id:row.id,title:row.title,slug:row.slug,routePath:row.route_path,seoTitle:row.seo_title,seoDescription:row.seo_description,sections:Array.isArray(row.published_content?.sections)?row.published_content.sections:[] };
}

export const orderUrl = appUrl(process.env.NEXT_PUBLIC_ORDER_APP_URL,brand.urls.order,process.env.NODE_ENV==='development');
export const money = (cents:number) => `RM ${(cents / 100).toFixed(2)}`;
