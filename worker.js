/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// 定义API路由的前缀
const API_PREFIX = '/api/pools';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 预检请求，用于处理CORS
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // 如果是API请求 (用于前端管理页面)
    if (path.startsWith(API_PREFIX)) {
      return handleApiRequest(request, env);
    } 
    // 如果是根路径的请求，说明是直接访问Worker，可以返回一个简单的提示
    else if (path === '/') {
       return new Response('Link Fuser Pro Worker is running. Use the frontend to configure your link pools.', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    // 其他所有请求都视为跳转请求
    else {
      return handleRedirectRequest(request, env);
    }
  },
};

// 处理API请求的逻辑
async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const id = path.substring(API_PREFIX.length + 1); // 从路径中提取ID

  let response;

  try {
    if (request.method === 'GET') {
      if (id) {
        // 获取单个链接池
        const value = await env.LINK_FUSER_KV.get(id);
        response = value ? new Response(value, { headers: { 'Content-Type': 'application/json' } }) : new Response('Not found', { status: 404 });
      } else {
        // 获取所有链接池
        const list = await env.LINK_FUSER_KV.list();
        const keys = list.keys.map(key => key.name);
        // 过滤掉轮询计数器
        const poolKeys = keys.filter(key => !key.endsWith('-counter'));
        const promises = poolKeys.map(key => env.LINK_FUSER_KV.get(key));
        const values = await Promise.all(promises);
        const pools = {};
        poolKeys.forEach((key, index) => {
          pools[key] = JSON.parse(values[index]);
        });
        response = new Response(JSON.stringify(pools), { headers: { 'Content-Type': 'application/json' } });
      }
    } else if (request.method === 'POST') {
      // 创建或更新链接池
      if (!id) return new Response('Pool ID is required', { status: 400 });
      const body = await request.json();
      await env.LINK_FUSER_KV.put(id, JSON.stringify(body));
      response = new Response('OK', { status: 200 });
    } else if (request.method === 'DELETE') {
      // 删除链接池
      if (!id) return new Response('Pool ID is required', { status: 400 });
      await env.LINK_FUSER_KV.delete(id);
       // 同时删除可能的计数器
      await env.LINK_FUSER_KV.delete(`${id}-counter`);
      response = new Response('Deleted', { status: 200 });
    } else {
      response = new Response('Method not allowed', { status: 405 });
    }
  } catch (e) {
    response = new Response(e.message, { status: 500 });
  }

  // 为API响应添加CORS头
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(response.body, { status: response.status, headers: newHeaders });
}


// 处理跳转请求的逻辑
async function handleRedirectRequest(request, env) {
  const url = new URL(request.url);
  const poolId = url.pathname.substring(1); // 路径就是ID

  if (!poolId) {
    return new Response('Pool ID not specified in URL path.', { status: 400 });
  }

  const data = await env.LINK_FUSER_KV.get(poolId);

  if (!data) {
    return new Response(`Pool with ID "${poolId}" not found.`, { status: 404 });
  }

  try {
    const { mode, links } = JSON.parse(data);
    if (!links || links.length === 0) {
      return new Response('This link pool is empty.', { status: 404 });
    }

    let targetUrl;

    if (mode === 'random') {
      const randomIndex = Math.floor(Math.random() * links.length);
      targetUrl = links[randomIndex];
    } else { // mode === 'poll'
      const counterKey = `${poolId}-counter`;
      let currentIndex = await env.LINK_FUSER_KV.get(counterKey);
      currentIndex = currentIndex ? parseInt(currentIndex, 10) : 0;
      
      if (currentIndex >= links.length) {
        currentIndex = 0;
      }
      
      targetUrl = links[currentIndex];
      
      const nextIndex = currentIndex + 1;
      // 将下一个索引存回KV，设置一个较短的过期时间以防万一
      await env.LINK_FUSER_KV.put(counterKey, nextIndex.toString(), { expirationTtl: 86400 }); // 24小时后自动过期
    }

    // 返回一个307临时重定向响应
    return Response.redirect(targetUrl, 307);

  } catch (error) {
    return new Response('Failed to process link pool data.', { status: 500 });
  }
}

// 处理CORS预检请求
function handleOptions(request) {
  const headers = request.headers;
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // 处理CORS预检请求
    const respHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };
    return new Response(null, { headers: respHeaders });
  } else {
    // 处理标准的OPTIONS请求
    return new Response(null, {
      headers: {
        Allow: 'GET, POST, DELETE, OPTIONS',
      },
    });
  }
}

