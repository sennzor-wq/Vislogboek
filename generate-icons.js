import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, r, g, b, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = crc32(body);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  // Table for CRC-32
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 at start of each scanline
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        // Inner gradient
        const t = dist / radius;
        rawData[pxOffset + 0] = Math.round(16 + (52 - 16) * (1 - t)); // R
        rawData[pxOffset + 1] = Math.round(185 + (211 - 185) * (1 - t)); // G (emerald)
        rawData[pxOffset + 2] = Math.round(129 + (153 - 129) * (1 - t)); // B
        rawData[pxOffset + 3] = 255;
      } else {
        // Background dark slate
        rawData[pxOffset + 0] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = a;
      }
    }
  }

  const idatCompressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', idatCompressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate files
const pwa192 = createPng(192, 192, 10, 42, 34);
fs.writeFileSync('public/pwa-192x192.png', pwa192);

const pwa512 = createPng(512, 512, 10, 42, 34);
fs.writeFileSync('public/pwa-512x512.png', pwa512);

const pwaMaskable = createPng(512, 512, 6, 28, 22);
fs.writeFileSync('public/pwa-maskable-512x512.png', pwaMaskable);

const appleIcon = createPng(180, 180, 10, 42, 34);
fs.writeFileSync('public/apple-touch-icon.png', appleIcon);

console.log('Generated PNG icons successfully.');
