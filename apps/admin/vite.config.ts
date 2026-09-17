import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {resolveMaps} from './lib/google-maps.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name:'local-maps-lookup',
    configureServer(server) {
      server.middlewares.use('/api/resolve-maps', async (req,res) => {
        res.setHeader('Content-Type','application/json');
        if(req.method!=='POST'){res.statusCode=405;res.end('{}');return;}
        try {
          let body='';
          for await (const chunk of req) {body+=chunk;if(body.length>9000)throw new Error('Link is too long.');}
          const {url}=JSON.parse(body);
          const coordinates=await resolveMaps(url);
          res.end(JSON.stringify({coordinates}));
        } catch(error) {
          res.statusCode=400;res.end(JSON.stringify({error:error instanceof Error?error.message:'Lookup failed.'}));
        }
      });
    }
  }],
  server: { host: true, port: 5174, strictPort: true },
})
