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
// Only diagnostic JSON from the public Reader API is inspected. Never retain raw bodies,
// URLs, headers, stack traces or arbitrary remote prose in UI-visible state.
export function readerFailureDetails(text) {
  if(typeof text!=='string' || text.length>8192) return null;
  let data;try {data=JSON.parse(text);} catch {return null;}
  if(!data || typeof data!=='object' || Array.isArray(data)) return null;
  const nested=data.error && typeof data.error==='object' ? data.error : {};
  const result={};
  for(const key of ['name','code']) {
    const value=data[key] ?? nested[key];
    if(typeof value==='string' && /^[A-Za-z][A-Za-z0-9_.]{0,63}$/.test(value)) result[key]=value;
    else if(key==='code' && Number.isSafeInteger(value) && value>=0 && value<=999999) result[key]=String(value);
  }
  const message=data.message ?? nested.message;
  if(typeof message==='string') {
    // A fixed vocabulary preserves actionable causes without copying unknown prose/secrets.
    const reasons=[];
    if(/failed to (?:goto|navigate|fetch)|failed fetching/i.test(message)) reasons.push('Upstream fetch failed');
    const network=message.match(/\b(?:net::)?(ERR_[A-Z_]{2,50})\b/);if(network) reasons.push(network[1]);
    if(/timed? ?out|timeout/i.test(message)) reasons.push('Timeout');
    if(/certificate|\bTLS\b|\bSSL\b/i.test(message)) reasons.push('TLS/certificate error');
    if(/access denied|forbidden|security|blocked|captcha|verify.{0,20}human|bot detection/i.test(message)) reasons.push('Access/security restriction');
    if(/rate limit|too many requests/i.test(message)) reasons.push('Rate limit');
    if(/no meaningful content|could not extract/i.test(message)) reasons.push('Content extraction failed');
    if(/redirect/i.test(message)) reasons.push('Redirect error');
    const status=message.match(/\b(?:HTTP|status(?: code)?)[: ]+([1-5]\d{2})\b/i);if(status) reasons.push(`Upstream HTTP ${status[1]}`);
    if(reasons.length) result.message=[...new Set(reasons)].join(' · ').slice(0,200);
  }
  return Object.keys(result).length ? result : null;
}
async function readReaderFailure(response) {
  // A small streamed cap prevents large HTML/error pages from being buffered.
  if(!response.body?.getReader) return null;
  const stream=response.body.getReader(),decoder=new TextDecoder();let text='',size=0;
  try {
    while(true) {
      const {done,value}=await stream.read();if(done) break;
      size+=value.byteLength;if(size>8192) {void stream.cancel().catch(()=>{});return null;}
      text+=decoder.decode(value,{stream:true});
    }
    text+=decoder.decode();return readerFailureDetails(text);
  } catch {return null;} finally {stream.releaseLock();}
}
export function createSourceReader({fetcher=fetch, now=Date.now, ttl=60000, force=false,wait=waitForRetry,attemptTimeoutMs=25000,maxRetryDelayMs=60000}={}) {
  const readings=new Map(),failures=new Map();
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
            const failure=!response.ok && isReader ? await readReaderFailure(response) : null;
            return {response,body,failure};
          })()]);
        } finally {clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);}
      };
      let response,body,failure;
      try {
        ({response,body,failure}=await attempt());
        // Only Reader rate limits are retried. Never retry denial (403), timeout or other failures.
        if(isReader && response.status===429) {
          const delay=retryAfterDelay(response.headers?.get?.('retry-after'),now(),maxRetryDelayMs);
          if(delay!==null) {
            await wait(delay,{signal:options.signal});
            if(options.signal?.aborted) throw abortError();
            ({response,body,failure}=await attempt());
          }
        }
      } catch(error) { if(!options.signal?.aborted) cache.delete(cacheKey);throw error; }
      if(!response.ok) { cache.delete(cacheKey);if(failure) failures.set(url,{status:response.status,...failure});else failures.delete(url);return response; }
      if(options.signal?.aborted) throw abortError();
      item={body,fetchedAt:now()};cache.set(cacheKey,item);
    }
    failures.delete(url);
    readings.set(url,item.fetchedAt);
    return {ok:true,status:200,text:async()=>item.body};
  };
  return {read,readings,failures};
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
