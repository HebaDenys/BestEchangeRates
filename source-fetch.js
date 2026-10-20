// In-memory public-page cache; never persist visitor input or claim a cached read is new.
const cache = new Map();
const abortError=()=>new DOMException('Aborted','AbortError');
export function retryAfterDelay(value,now=Date.now(),maxDelay=60000) {
  if(value==null || value==='') return maxDelay>=60000 ? 60000 : null;
  const text=String(value).trim();
  const delay=/^\d+$/.test(text) ? Number(text)*1000 : /^[A-Za-z]{3}, /.test(text) ? Date.parse(text)-now : NaN;
  return Number.isFinite(delay) && delay>=0 && delay<=maxDelay ? delay : null;
}
export function waitForRetry(ms,{signal}={}) {
  return new Promise((resolve,reject)=>{
    if(signal?.aborted) {reject(abortError());return;}
    const finish=()=>{signal?.removeEventListener('abort',cancel);resolve();};
    const timer=setTimeout(finish,ms);
    const cancel=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);reject(abortError());};
    signal?.addEventListener('abort',cancel,{once:true});
  });
}
export function createSourceReader({fetcher=fetch, now=Date.now, ttl=60000, force=false,wait=waitForRetry,attemptTimeoutMs=25000,maxRetryDelayMs=60000}={}) {
  const readings=new Map();
  const read=async(url,options={})=>{
    if(options.signal?.aborted) throw new DOMException('Aborted','AbortError');
    const headers=new Headers(options.headers);
    // Reader caches upstream pages too: a local bypass alone does not refresh the source.
    // https://r.jina.ai/docs — these headers belong only on Reader requests, never direct APIs.
    let isReader=false;
    try { const target=new URL(url); isReader=target.protocol==='https:' && target.hostname==='r.jina.ai'; } catch {}
    if(isReader) {
      headers.set('X-Cache-Tolerance','60');
      if(force) headers.set('X-No-Cache','true');
      options={...options,headers};
    }
    const format=headers.get('x-return-format') || 'default';
    const cacheKey=`${url}::${format}`;
    if(force) cache.delete(cacheKey);
    let item=cache.get(cacheKey);
    if(force || !item || now()-item.fetchedAt>=ttl) {
      // Bound each network attempt (including body consumption), not the Retry-After pause.
      const attempt=async()=>{
        const controller=new AbortController();
        let timer,cancel;
        const interruption=new Promise((_,reject)=>{
          cancel=()=>{controller.abort();reject(abortError());};
          options.signal?.addEventListener('abort',cancel,{once:true});
          timer=setTimeout(()=>{controller.abort();reject(new DOMException('Source attempt timed out','TimeoutError'));},attemptTimeoutMs);
          if(options.signal?.aborted) cancel();
        });
        try {
          return await Promise.race([interruption,(async()=>{
            if(controller.signal.aborted) throw abortError();
            const response=await fetcher(url,{...options,signal:controller.signal});
            const body=response.ok ? await response.text() : null;
            return {response,body};
          })()]);
        } finally {clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);}
      };
      let response,body;
      try {
        ({response,body}=await attempt());
        // Only Reader rate limits are retried. Never retry denial (403), timeout or other failures.
        if(isReader && response.status===429) {
          const delay=retryAfterDelay(response.headers?.get?.('retry-after'),now(),maxRetryDelayMs);
          if(delay!==null) {
            await wait(delay,{signal:options.signal});
            if(options.signal?.aborted) throw abortError();
            ({response,body}=await attempt());
          }
        }
      } catch(error) { if(!options.signal?.aborted) cache.delete(cacheKey);throw error; }
      if(!response.ok) { cache.delete(cacheKey);return response; }
      if(options.signal?.aborted) throw abortError();
      item={body,fetchedAt:now()};cache.set(cacheKey,item);
    }
    readings.set(url,item.fetchedAt);
    return {ok:true,status:200,text:async()=>item.body};
  };
  return {read,readings};
}

// Fixed display vocabulary: never expose arbitrary remote response/error text in the UI.
export function sourceFailureReason(error,{timedOut=false,aborted=false}={}) {
  if(timedOut || aborted || error?.name==='AbortError' || error?.name==='TimeoutError') return 'Tiempo de espera agotado';
  const status=String(error?.message || '').match(/\bHTTP ([1-5]\d{2})\b/);
  if(status) return `HTTP ${status[1]}${status[1]==='429' ? ' · Límite temporal de consultas' : ''}`;
  if(error?.name==='TypeError') return 'Error de conexión';
  if(/Sin cotización|No hay cotizaciones/i.test(error?.message || '')) return 'Sin cotización verificable';
  return 'Formato de fuente no verificable';
}

// Interleave banks and local sources, preserving order inside each group.
export function fairSourceQueue(sources,isBank) {
  const banks=sources.filter(isBank),local=sources.filter(source=>!isBank(source)),queue=[];
  for(let i=0;i<Math.max(banks.length,local.length);i++) {
    if(local[i]) queue.push(local[i]);
    if(banks[i]) queue.push(banks[i]);
  }
  return queue;
}
