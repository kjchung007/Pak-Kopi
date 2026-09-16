import {createClient} from '@supabase/supabase-js';
import {configureDemoUpdates} from '@coffee/brand/demo-client';
export const supabase=configureDemoUpdates(createClient(import.meta.env.VITE_SUPABASE_URL||'http://127.0.0.1:54321',import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'local-demo-public'),import.meta.env.VITE_LOCAL_DEMO==='true');
