// Public status UI: all metrics come from the bounded read-only ledger API.
const HEADERS = { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>QuranChain | Ledger status</title>
<style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#0a0a0f;color:#e8e6f0}*{box-sizing:border-box}body{margin:0}main{max-width:880px;margin:0 auto;padding:48px 24px}a{color:#f5b942}nav{display:flex;justify-content:space-between;margin-bottom:60px}h1{font-size:clamp(2rem,6vw,3.5rem);margin-bottom:12px}p{line-height:1.6;color:#b9b9c8}.status{padding:24px;border:1px solid #383847;border-radius:12px;margin:32px 0;background:#121219}#status{font-size:1.35rem;color:#f5b942}dl{display:grid;grid-template-columns:1fr 1fr;gap:16px}dt{color:#a0a0b2}dd{margin:0;overflow-wrap:anywhere}button{background:#f5b942;color:#131313;padding:12px 22px;border:0;border-radius:6px;font-weight:600;cursor:pointer}button:disabled{opacity:.6}small{color:#b9b9c8}@media(max-width:500px){dl{grid-template-columns:1fr}dd{margin-bottom:12px}}
</style></head><body><main>
<nav><strong>QuranChain</strong><a href="https://darcloud.host">DarCloud</a></nav>
<h1>Ledger status</h1>
<p>Read-only observations from the QuranChain bot's local ledger. Stored records do not establish a live blockchain network, verified consensus, or collected revenue.</p>
<section class="status" aria-live="polite"><h2 id="status">Checking data availability</h2><p id="message">No ledger observation has been received.</p>
<dl><dt>Stored blocks</dt><dd id="blocks">Unavailable</dd><dt>Stored transactions</dt><dd id="transactions">Unavailable</dd><dt>Source</dt><dd id="source">Not observed</dd><dt>Observation time (UTC)</dt><dd id="observed">Unavailable</dd><dt>Latest stored record</dt><dd id="latest">Unavailable</dd></dl></section>
<button id="refresh" type="button">Refresh status</button>
<p><a href="/api/chain/status">Read-only status API</a></p>
<small>Freshness describes when the ledger was read, not whether blocks are progressing. Observations older than 60 seconds are marked stale.</small>
</main><script>
const byId=(id)=>document.getElementById(id);
let expiryTimer=null;
let expiresAt=null;
function clearExpiry(){
  if(expiryTimer!==null)clearTimeout(expiryTimer);
  expiryTimer=null;expiresAt=null;
}
function markStale(){
  clearExpiry();
  byId('status').textContent='Stale ledger observation';
  byId('message').textContent='This observation has expired. The values below are historical and may have changed.';
}
async function refresh(){
  byId('refresh').disabled=true;
  try{
    const response=await fetch('/api/chain/status',{cache:'no-store'});
    const result=await response.json();
    if(!['fresh','stale','unavailable'].includes(result.status))throw new Error('Unexpected response');
    if(result.status==='fresh'&&(!Number.isFinite(result.age_seconds)||result.age_seconds<0||!Number.isFinite(result.max_age_seconds)||result.max_age_seconds<=0))throw new Error('Missing observation age');
    clearExpiry();
    byId('status').textContent=result.status==='fresh'?'Ledger observation available':result.status==='stale'?'Stale ledger observation':'Ledger unavailable';
    byId('message').textContent=result.status==='fresh'?'These counts were read from the local ledger.':result.status==='stale'?'This observation has expired. The values below are historical and may have changed.':'A current ledger observation could not be retrieved.';
    byId('blocks').textContent=result.data?String(result.data.block_count):'Unavailable';
    byId('transactions').textContent=result.data?String(result.data.transaction_count):'Unavailable';
    byId('source').textContent=result.observed_at?'QuranChain bot / local SQLite ledger':'Not observed';
    byId('observed').textContent=result.observed_at||'Unavailable';
    const latest=result.data&&result.data.latest_block;
    byId('latest').textContent=latest?'Record '+latest.index+' / '+latest.chain+' #'+latest.chain_index+' / '+latest.timestamp:result.data?'No stored blocks':'Unavailable';
    if(result.status==='fresh'){
      const remaining=Math.max(0,(result.max_age_seconds-result.age_seconds)*1000);
      if(remaining===0)markStale();
      else{expiresAt=Date.now()+remaining;expiryTimer=setTimeout(markStale,remaining);}
    }
  }catch{
    clearExpiry();
    byId('status').textContent='Ledger unavailable';
    byId('message').textContent='A current ledger observation could not be retrieved.';
    for(const id of ['blocks','transactions','observed','latest'])byId(id).textContent='Unavailable';
    byId('source').textContent='Not observed';
  }finally{byId('refresh').disabled=false;}
}
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&expiresAt!==null&&Date.now()>=expiresAt)markStale();
});
byId('refresh').addEventListener('click',refresh);refresh();
</script></body></html>`;
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET') return Response.json({error:'method_not_allowed'},{status:405,headers:{Allow:'GET','Cache-Control':'no-store'}});
    if (url.pathname === '/' || url.pathname === '/explorer') return new Response(PAGE,{headers:HEADERS});
    return Response.json({error:'not_found'},{status:404,headers:{'Cache-Control':'no-store'}});
  }
};
