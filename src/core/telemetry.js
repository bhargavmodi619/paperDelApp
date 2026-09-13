// The thinnest possible event beacon. claude.md section 5: "a tiny custom
// beacon is fine, don't pull in a heavy SDK."
//
// Every event is one small POST to /e on the same origin, which the Worker in
// worker/index.js writes to Analytics Engine. sendBeacon is used so events
// still go out while the page is being backgrounded or closed — the moment
// that matters most for "where did they quit".
//
// It is a no-op unless served over http(s): nothing is sent from a file://
// double-click, from the headless tests, or from anywhere without a window.
// No personal data is collected: a random per-load session id and the event
// fields, nothing else.

var enabled = (typeof window !== 'undefined' && typeof location !== 'undefined' &&
               /^https?:$/.test(location.protocol) && typeof navigator !== 'undefined');

var session = (function(){
  var s = '';
  for(var i=0;i<16;i++) s += (Math.random()*16|0).toString(16);
  return s;
})();

var t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
function elapsed(){ return (typeof performance !== 'undefined' && performance.now) ? (performance.now()-t0)/1000 : 0; }

/* name: short string. data: flat object of strings/numbers. */
function track(name, data){
  if(!enabled) return;
  try{
    var payload = { e:name, s:session, t:Math.round(elapsed()) };
    if(data) for(var k in data) if(Object.prototype.hasOwnProperty.call(data,k)) payload[k] = data[k];
    var body = JSON.stringify(payload);
    if(navigator.sendBeacon && navigator.sendBeacon('/e', new Blob([body], { type:'text/plain' }))) return;
    if(typeof fetch === 'function') fetch('/e', { method:'POST', body:body, keepalive:true, headers:{'content-type':'text/plain'} }).catch(function(){});
  }catch(e){}
}

export { track, session, elapsed };
