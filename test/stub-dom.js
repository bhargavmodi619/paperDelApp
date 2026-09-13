/* A canvas stub just real enough to run the game headlessly.
   Every 2D-context method is a no-op; the point is to prove the code
   drives the context without throwing, not to compare pixels. */

function makeContext(){
  const gradient = { addColorStop(){} };
  const noop = () => {};
  const named = {
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    measureText: () => ({ width: 0 }),
    save: noop, restore: noop
  };
  const cache = new Map();
  return new Proxy({}, {
    get(target, prop){
      if (prop in named) return named[prop];
      if (prop in target) return target[prop];
      if (!cache.has(prop)) cache.set(prop, noop);
      return cache.get(prop);
    },
    set(target, prop, value){ target[prop] = value; return true; }
  });
}

export function installDom(){
  const canvas = {
    width: 0, height: 0,
    getContext: () => makeContext(),
    addEventListener(){},
    getBoundingClientRect: () => ({ left:0, top:0, width:400, height:700 })
  };
  globalThis.document = { getElementById: id => (id === 'game' ? canvas : null) };
  globalThis.window = { devicePixelRatio: 2, addEventListener(){} };  // no rAF: we step frames by hand
  return canvas;
}
