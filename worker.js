/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// export interface Env {
//   // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
//   LINK_FUSER_KV: KVNamespace;
//   //
//   // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
//   // MY_BUCKET: R2Bucket;
//   //
//   // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
//   // MY_SERVICE: Fetcher;
//   //
//   // Example binding to a Queue. Learn more at https://developers.cloudflare.com/workers/runtime-apis/queues/
//   // MY_QUEUE: Queue;
// }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ message }, status);
}

async function handleOptions(request) {
  return new Response(null, { headers: corsHeaders });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path.startsWith('/api/pools')) {
        const idMatch = path.match(/^\/api\/pools\/(.+)/);
        const id = idMatch ? idMatch[1] : null;

        if (request.method === 'GET') {
          if (id) {
            // Get a single pool
            const pool = await env.LINK_FUSER_KV.get(id, 'json');
            return pool ? jsonResponse(pool) : errorResponse('Pool not found', 404);
          } else {
            // List all pools
            const list = await env.LINK_FUSER_KV.list();
            const keys = list.keys.map(key => key.name);
            const pools = await Promise.all(keys.map(key => env.LINK_FUSER_KV.get(key, 'json')));
            return jsonResponse(pools.filter(Boolean));
          }
        }

        if (request.method === 'POST') {
          const { name } = await request.json();
          if (!name || typeof name !== 'string') {
            return errorResponse('Name is required');
          }
          const id = crypto.randomUUID();
          const newPool = {
            id,
            name,
            urls: [],
            mode: 'random',
            createdAt: new Date().toISOString(),
          };
          await env.LINK_FUSER_KV.put(id, JSON.stringify(newPool));
          return jsonResponse(newPool, 201);
        }

        if (id) {
          if (request.method === 'PUT') {
            const existingPool = await env.LINK_FUSER_KV.get(id, 'json');
            if (!existingPool) {
              return errorResponse('Pool not found', 404);
            }
            const dataToUpdate = await request.json();
            const updatedPool = { ...existingPool, ...dataToUpdate, id }; // Ensure ID is not overwritten
            await env.LINK_FUSER_KV.put(id, JSON.stringify(updatedPool));
            return jsonResponse(updatedPool);
          }

          if (request.method === 'DELETE') {
            await env.LINK_FUSER_KV.delete(id);
            return new Response(null, { status: 204, headers: corsHeaders });
          }
        }
      }

      return errorResponse('Not found', 404);

    } catch (e) {
      return errorResponse(e.message, 500);
    }
  },
};
