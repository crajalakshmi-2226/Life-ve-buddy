import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makePng(width, height, isMaskable = false) {
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.45;
  const rInner = width * (isMaskable ? 0.32 : 0.38);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background: Deep Royal Purple (#3b0764 to #581c87)
      const grad = (y / height);
      let r = Math.round(59 + grad * 30);
      let g = Math.round(7 + grad * 21);
      let b = Math.round(100 + grad * 35);
      let a = 255;

      // Outer glowing ring
      if (dist < rOuter && dist > rOuter - (width * 0.03)) {
        r = 192; g = 132; b = 252; // purple-400
      } else if (dist <= rInner) {
        // Center shield / badge background (#7e22ce)
        r = 126; g = 34; b = 206;
      }

      // Center symbol (stylized "L" + star / sparkles in gold/white)
      const nx = (x - cx) / width;
      const ny = (y - cy) / height;
      
      // Vertical stem of L
      if (nx >= -0.16 && nx <= -0.07 && ny >= -0.22 && ny <= 0.20) {
        r = 250; g = 204; b = 21; // amber/gold
      }
      // Horizontal base of L
      if (nx >= -0.16 && nx <= 0.16 && ny >= 0.12 && ny <= 0.20) {
        r = 250; g = 204; b = 21; // amber/gold
      }
      // Star / diamond dot top right
      const starDx = Math.abs(nx - 0.08);
      const starDy = Math.abs(ny + 0.10);
      if (starDx + starDy < 0.10) {
        r = 255; g = 255; b = 255; // sparkle white
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrLen = Buffer.alloc(4);
  ihdrLen.writeUInt32BE(13, 0);
  const ihdrType = Buffer.from('IHDR');
  const ihdrCrcBuf = Buffer.concat([ihdrType, ihdrData]);
  const ihdrCrc = Buffer.alloc(4);
  ihdrCrc.writeUInt32BE(crc32(ihdrCrcBuf), 0);
  const ihdrChunk = Buffer.concat([ihdrLen, ihdrType, ihdrData, ihdrCrc]);

  // IDAT chunk
  const idatLen = Buffer.alloc(4);
  idatLen.writeUInt32BE(compressed.length, 0);
  const idatType = Buffer.from('IDAT');
  const idatCrcBuf = Buffer.concat([idatType, compressed]);
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc32(idatCrcBuf), 0);
  const idatChunk = Buffer.concat([idatLen, idatType, compressed, idatCrc]);

  // IEND chunk
  const iendLen = Buffer.alloc(4);
  iendLen.writeUInt32BE(0, 0);
  const iendType = Buffer.from('IEND');
  const iendCrc = Buffer.alloc(4);
  iendCrc.writeUInt32BE(crc32(iendType), 0);
  const iendChunk = Buffer.concat([iendLen, iendType, iendCrc]);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), makePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), makePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), makePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), makePng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), makePng(64, 64, false));

// Generate icon.svg
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b0764"/>
      <stop offset="50%" stop-color="#581c87"/>
      <stop offset="100%" stop-color="#7e22ce"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)"/>
  <circle cx="256" cy="256" r="210" fill="none" stroke="#c084fc" stroke-width="8" stroke-dasharray="16 8" opacity="0.6"/>
  <!-- Central Badge -->
  <path d="M 256 90 L 380 150 L 380 280 C 380 360 256 420 256 420 C 256 420 132 360 132 280 L 132 150 Z" fill="#6b21a8" stroke="#d8b4fe" stroke-width="6"/>
  <!-- Stylized L and Graduation/Star -->
  <path d="M 200 180 L 230 180 L 230 310 L 310 310 L 310 335 L 200 335 Z" fill="url(#goldGrad)"/>
  <polygon points="310,195 322,215 345,218 328,234 332,256 310,245 288,256 292,234 275,218 298,215" fill="#ffffff"/>
  <circle cx="310" cy="226" r="6" fill="#facc15"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg, 'utf8');

console.log('Icons generated successfully in /public');
