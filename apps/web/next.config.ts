import type { NextConfig } from 'next';
import { networkInterfaces } from 'node:os';
const localAddresses=Object.values(networkInterfaces()).flat().filter(item=>item&&!item.internal&&item.family==='IPv4').map(item=>item!.address);
const config:NextConfig={reactStrictMode:true,images:{remotePatterns:[{protocol:'https',hostname:'iskgonautyyuygpktexv.supabase.co',port:'',pathname:'/storage/v1/object/public/public-assets/**'}]},transpilePackages:['@coffee/brand'],allowedDevOrigins:localAddresses,distDir:process.env.PAK_KOPI_BUILD_CHECK==='1'?'.next-check':process.env.WEBSITE_DRAFT_PREVIEW==='true'?'.next-preview':'.next'};
export default config;
