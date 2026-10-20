// In-memory public-page cache; never persist visitor input or claim a cached read is new.
const cache = new Map();
export function createSourceReader({fetcher=fetch, now=Date.now, ttl=60000, force=false}={}) {
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
      let response;
      try { response=await fetcher(url,options); } catch(error) { if(!options.signal?.aborted) cache.delete(cacheKey); throw error; }
      if(!response.ok) { cache.delete(cacheKey); return response; }
      const body=await response.text();
      if(options.signal?.aborted) throw new DOMException('Aborted','AbortError');
      item={body,fetchedAt:now()};cache.set(cacheKey,item);
    }
    readings.set(url,item.fetchedAt);
    return {ok:true,status:200,text:async()=>item.body};
  };
  return {read,readings};
}

// Fixed display vocabulary: never expose arbitrary remote response/error text in the UI.
export function sourceFailureReason(error,{timedOut=false,aborted=false}={}) {
  if(timedOut || aborted || error?.name==='AbortError') return 'Tiempo de espera agotado';
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
