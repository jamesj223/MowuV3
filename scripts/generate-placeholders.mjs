import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const cardsDir = path.resolve('public', 'cards');
if (!fs.existsSync(cardsDir)) {
  fs.mkdirSync(cardsDir, { recursive: true });
}

// Generate an uncompressed or zlib-compressed truecolor PNG (320 x 240)
function createPng(width, height, r, g, b) {
  const bytesPerPixel = 3;
  const rowBytes = width * bytesPerPixel;
  const rawData = Buffer.alloc(height * (1 + rowBytes));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + rowBytes);
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      // Border
      const isBorder = x < 4 || x >= width - 4 || y < 4 || y >= height - 4;
      // Grid pattern for sketchpad feel
      const isGrid = (x % 20 === 0 || y % 20 === 0) && !isBorder;

      if (isBorder) {
        rawData[pixelOffset] = 40;
        rawData[pixelOffset + 1] = 40;
        rawData[pixelOffset + 2] = 40;
      } else if (isGrid) {
        rawData[pixelOffset] = Math.min(255, r + 20);
        rawData[pixelOffset + 1] = Math.min(255, g + 20);
        rawData[pixelOffset + 2] = Math.min(255, b + 20);
      } else {
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 2; // Color type: Truecolor
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT Chunk
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Simple CRC32 implementation
function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[i] = c;
}

// Color palettes for different card themes
const palettes = {
  red: [248, 215, 218],
  green: [212, 237, 218],
  blue: [204, 229, 255],
  white: [255, 243, 205],
  black: [226, 227, 229],
  colorless: [230, 230, 230],
};

// Read every card's art file (and mana cost, for a colour hint) from the card data,
// so new cards get a blank canvas automatically.
const dataDir = path.resolve('src', 'data');
const colourPalette = { W: palettes.white, U: palettes.blue, B: palettes.black, R: palettes.red, G: palettes.green };
const cardFiles = [];
const seen = new Set();
for (const file of fs.readdirSync(dataDir).filter((f) => f.endsWith('.ts'))) {
  const source = fs.readFileSync(path.join(dataDir, file), 'utf8');
  for (const [, manaCost, artFile] of source.matchAll(/manaCost:\s*'([^']*)'[\s\S]*?artFile:\s*'([^']+)'/g)) {
    if (seen.has(artFile)) continue;
    seen.add(artFile);
    const colour = (manaCost.match(/[WUBRG]/) ?? [])[0];
    cardFiles.push({ name: artFile, palette: colourPalette[colour] ?? palettes.colorless });
  }
}

const blank = (card) => createPng(320, 220, ...card.palette);

if (process.argv.includes('--status')) {
  // Report which art files are still the untouched blank canvas
  const drawn = [];
  const blanks = [];
  const missing = [];
  for (const card of cardFiles) {
    const filePath = path.join(cardsDir, card.name);
    if (!fs.existsSync(filePath)) missing.push(card.name);
    else if (fs.readFileSync(filePath).equals(blank(card))) blanks.push(card.name);
    else drawn.push(card.name);
  }
  console.log(`Card art: ${drawn.length} drawn, ${blanks.length} blank, ${missing.length} missing (of ${cardFiles.length}).`);
  if (blanks.length) console.log(`\nStill blank (see docs/ART-LIST.md for priority):\n  ${blanks.join('\n  ')}`);
  if (missing.length) console.log(`\nMissing (run npm run placeholders):\n  ${missing.join('\n  ')}`);
} else {
  for (const card of cardFiles) {
    const filePath = path.join(cardsDir, card.name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, blank(card));
      console.log(`Created template MS Paint canvas: ${card.name}`);
    }
  }
}
