/* Draws the app icon and writes it as a PNG with nothing but Node's zlib.
 *
 * Why not just check in a PNG? Because then the icon is a binary nobody can
 * diff or regenerate, and the repo's "no tools, no packages" property is
 * worth keeping even here. This is ~80 lines and produces a real PNG that
 * WhatsApp, iOS and browsers all accept.
 *
 * The icon is the game's delivery pin: an orange map pin holding a folded
 * paper, on the night-blue the page background uses. */
import zlib from 'node:zlib';

/* ---- minimal PNG encoder (8-bit RGBA, no interlace) ---- */
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++){
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return buf => {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  };
})();

function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(td));
  return Buffer.concat([len, td, crc]);
}

function encodePng(width, height, rgba){
  const raw = Buffer.alloc((width*4 + 1) * height);
  for (let y = 0; y < height; y++){
    raw[y*(width*4+1)] = 0;                          // filter: none
    rgba.copy(raw, y*(width*4+1) + 1, y*width*4, (y+1)*width*4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---- the drawing: signed distances, blended with soft edges ---- */
const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const BG = hex('#16202c'), PIN = hex('#ff8a15'), PIN_DARK = hex('#d9700c'),
      PAPER = hex('#fdfbf0'), INK = hex('#c4452f');

function sdRoundRect(px, py, cx, cy, hw, hh, r){
  const dx = Math.abs(px-cx) - hw + r, dy = Math.abs(py-cy) - hh + r;
  return Math.min(Math.max(dx,dy),0) + Math.hypot(Math.max(dx,0), Math.max(dy,0)) - r;
}
function sdCircle(px, py, cx, cy, r){ return Math.hypot(px-cx, py-cy) - r; }
/* pin body: circle head + triangle to a point below */
function sdPin(px, py, cx, cy, r, tipY){
  const head = sdCircle(px, py, cx, cy, r);
  /* triangle from the circle's tangent points down to the tip */
  const t = (py - cy) / (tipY - cy);
  const halfW = r * 0.92 * (1 - Math.max(0, t));
  const tri = (py >= cy && py <= tipY) ? Math.abs(px-cx) - halfW : 1e9;
  return Math.min(head, tri);
}
const cover = d => Math.max(0, Math.min(1, 0.5 - d));   // 1px anti-alias

function blend(dst, i, col, a){
  dst[i]   = Math.round(dst[i]  *(1-a) + col[0]*a);
  dst[i+1] = Math.round(dst[i+1]*(1-a) + col[1]*a);
  dst[i+2] = Math.round(dst[i+2]*(1-a) + col[2]*a);
  dst[i+3] = Math.max(dst[i+3], Math.round(255*a));
}

export function makeIconPng(size){
  const s = size, px = Buffer.alloc(s*s*4, 0);
  const k = s/512;                                   // designed at 512
  for (let y = 0; y < s; y++){
    for (let x = 0; x < s; x++){
      const i = (y*s + x)*4, X = x/k + 0.5, Y = y/k + 0.5;
      /* background tile with rounded corners */
      blend(px, i, BG, cover(sdRoundRect(X, Y, 256, 256, 256, 256, 92)*k));
      /* soft ground shadow under the pin */
      const sh = sdCircle(X, (Y-418)*3.2 + 418, 256, 418, 78);
      blend(px, i, [0,0,0], 0.28 * Math.max(0, Math.min(1, 0.5 - sh*k/14)));
      /* pin, with a darker right side for a little form */
      const pin = sdPin(X, Y, 256, 206, 128, 412);
      const a = cover(pin*k);
      if (a > 0) blend(px, i, X > 256 + (Y-206)*0.15 ? PIN_DARK : PIN, a);
      /* the paper in the head */
      blend(px, i, PAPER, cover(sdRoundRect(X, Y, 256, 202, 74, 50, 14)*k));
      blend(px, i, INK,   cover(sdRoundRect(X, Y, 256, 186, 48, 7, 3)*k));
      blend(px, i, [0,0,0], 0.16*cover(sdRoundRect(X, Y, 246, 214, 36, 6, 3)*k));
      /* highlight on the pin's upper-left */
      blend(px, i, [255,255,255], 0.22*cover(sdCircle(X, Y, 212, 150, 30)*k));
    }
  }
  return encodePng(s, s, px);
}
