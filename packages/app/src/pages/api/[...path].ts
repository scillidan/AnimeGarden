import type { APIRoute } from 'astro';

import { SERVER_HOST, SERVER_PORT, SERVER_PROTOCOL, SERVER_BASE } from '~build/meta';

import { getRuntimeEnv } from '../../utils';

export const ALL: APIRoute = async ({ request, locals }) => {
  const env = getRuntimeEnv(locals);

  const url = new URL(request.url);

  if (SERVER_HOST) {
    url.protocol = SERVER_PROTOCOL + ':';
    url.host = SERVER_HOST;
    url.port = SERVER_PORT ?? '';
  }

  url.pathname = SERVER_BASE
    ? url.pathname.replace(/^\/api\/?/, SERVER_BASE)
    : url.pathname.replace(/^\/api/, '');

  try {
    const timer = createTimer(`Forward request to ${url.pathname}`);
    timer.start();

    const subRequest = new Request(url, request.clone());
    const response = env?.worker?.fetch
      ? await env.worker.fetch(subRequest)
      : await fetch(subRequest);

    timer.end();

    return new Response(response.body, {
      headers: {
        'cache-control': request.method === 'GET' ? `public, max-age=300` : 'no-store',
        // @ts-ignore
        ...Object.fromEntries(response.headers.entries()),
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'access-control-allow-headers': 'Content-Type, Cache-Control, Authorization'
      }
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        status: 500,
        message: (error as any)?.message ?? 'unknown'
      }),
      { status: 500 }
    );
  }
};

export function createTimer(label: string) {
  let start = new Date();
  return {
    start() {
      start = new Date();
    },
    end() {
      const end = new Date();
      console.log(`${label}: ${((end.getTime() - start.getTime()) / 1000).toFixed(0)}ms`);
    }
  };
}
