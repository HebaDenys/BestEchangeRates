// In-memory public-page cache; never persist visitor input or claim a cached read is new.
const cache = new Map();
export function createSourceReader({fetcher=fetch, now=Date.now, ttl=60000, force=false}={}) {
  const readings=new Map();
  const read=async(url,options={})=>{
    if(options.signal?.aborted) throw new DOMException('Aborted','AbortError');
    const headers=new Headers(options.headers);
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
