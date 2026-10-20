// In-memory public-page cache; never persist visitor input or claim a cached read is new.
const cache = new Map();
export function createSourceReader({fetcher=fetch, now=Date.now, ttl=60000, force=false}={}) {
  const readings=new Map();
  const read=async(url,options={})=>{
    if(options.signal?.aborted) throw new DOMException('Aborted','AbortError');
    if(force) cache.delete(url);
    let item=cache.get(url);
    if(force || !item || now()-item.fetchedAt>=ttl) {
      let response;
      try { response=await fetcher(url,options); } catch(error) { if(!options.signal?.aborted) cache.delete(url); throw error; }
      if(!response.ok) { cache.delete(url); return response; }
      const body=await response.text();
      if(options.signal?.aborted) throw new DOMException('Aborted','AbortError');
      item={body,fetchedAt:now()};cache.set(url,item);
    }
    readings.set(url,item.fetchedAt);
    return {ok:true,status:200,text:async()=>item.body};
  };
  return {read,readings};
}
