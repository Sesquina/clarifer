/**
 * Generates solid-color placeholder PNG assets for Expo Go compatibility.
 * Uses only Node.js built-ins (zlib, fs, path) — no npm packages required.
 * Final logo (anchor design) replaces these in Sprint 8.
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Build CRC32 lookup table (PNG spec requirement)
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function solidPNG(width, height, r, g, b) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bit depth 8, color type 2 (RGB), compression 0, filter 0, interlace 0
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw image rows: filter byte (0 = None) + RGB pixels per row
  const row = Buffer.allocUnsafe(1 + width * 3);
  row[0] = 0; // filter: None
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  // All rows are identical — repeat the single row buffer
  const raw = Buffer.concat(Array(height).fill(row));
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const assetsDir = path.join(__dirname, "..", "assets");
fs.mkdirSync(assetsDir, { recursive: true });

const assets = [
  { file: "icon.png",          w: 1024, h: 1024, r: 0x2c, g: 0x5f, b: 0x4a }, // #2C5F4A
  { file: "adaptive-icon.png", w: 1024, h: 1024, r: 0x2c, g: 0x5f, b: 0x4a },
  { file: "splash.png",        w: 1284, h: 2778, r: 0xf7, g: 0xf2, b: 0xea }, // #F7F2EA
  { file: "favicon.png",       w:   32, h:   32, r: 0x2c, g: 0x5f, b: 0x4a },
];

for (const { file, w, h, r, g, b } of assets) {
  const dest = path.join(assetsDir, file);
  fs.writeFileSync(dest, solidPNG(w, h, r, g, b));
  const kb = (fs.statSync(dest).size / 1024).toFixed(1);
  console.log(`  created ${file} (${w}x${h}, ${kb} KB)`);
}

console.log("Done — placeholder assets ready in apps/mobile/assets/");
