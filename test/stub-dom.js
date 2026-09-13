/* A canvas stub just real enough to run the game headlessly.
   Every 2D-context method is a no-op; the point is to prove the code drives
   the context without throwing, not to compare pixels.

   It does validate one thing, though: every numeric argument must be finite.
   A NaN or Infinity coordinate draws absolutely nothing in a real browser and
   shows up as "the art is broken" rather than as an error, and the projection
   maths is exactly where that happens. Better to fail loudly here. */

function checkFinite(name, args){
  for (let i = 0; i < args.length; i++){
    const v = args[i];
    if (typeof v === 'number' && !Number.isFinite(v)){
      throw new Error('ctx.' + name + ' got a non-finite argument at index ' + i +
                      ': ' + v + '  (args: ' + args.join(', ') + ')');
    }
  }
}

function makeContext(strict){
  const gradient = { addColorStop(){} };
  const noop = () => {};
  const named = {
    createLinearGradient: (...a) => { if (strict) checkFinite('createLinearGradient', a); return gradient; },
    createRadialGradient: (...a) => { if (strict) checkFinite('createRadialGradient', a); return gradient; },
    measureText: () => ({ width: 0 }),
    save: noop, restore: noop
  };
  const cache = new Map();
  return new Proxy({}, {
    get(target, prop){
      if (prop in named) return named[prop];
      if (prop in target) return target[prop];
      if (!cache.has(prop)){
        cache.set(prop, strict
          ? (...a) => { checkFinite(String(prop), a); }
          : noop);
      }
      return cache.get(prop);
    },
    set(target, prop, value){
      if (strict && typeof value === 'number' && !Number.isFinite(value)){
        throw new Error('ctx.' + String(prop) + ' was set to ' + value);
      }
      target[prop] = value;
      return true;
    }
  });
}

/* strict: reject non-finite draw coordinates. Default on. */
export function installDom(opts){
  const strict = !opts || opts.strict !== false;
  const canvas = {
    width: 0, height: 0,
    getContext: () => makeContext(strict),
    addEventListener(){},
    getBoundingClientRect: () => ({ left:0, top:0, width:400, height:700 })
  };
  globalThis.document = { getElementById: id => (id === 'game' ? canvas : null) };
  globalThis.window = { devicePixelRatio: 2, addEventListener(){} };  // no rAF: we step frames by hand
  return canvas;
}
