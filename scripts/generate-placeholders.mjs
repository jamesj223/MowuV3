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

const cardFiles = [
  { name: 'homing-fireball-pigeon.png', palette: palettes.red },
  { name: 'chump-blocker.png', palette: palettes.green },
  { name: 'wall-of-beef.png', palette: palettes.green },
  { name: 'wrath-of-oops.png', palette: palettes.white },
  { name: 'bureaucratic-delay.png', palette: palettes.white },
  { name: 'laser-pointer.png', palette: palettes.black },
  { name: 'meat-pie.png', palette: palettes.white },
  { name: 'clumsy-thief.png', palette: palettes.blue },
  { name: 'tax-collector-mowu.png', palette: palettes.green },
  { name: 'toxic-mosquito.png', palette: palettes.black },
  { name: 'commander-banishment.png', palette: palettes.blue },
  { name: 'graveyard-vacuum.png', palette: palettes.colorless },
  { name: 'apex-behemoth.png', palette: palettes.green },
  { name: 'ghostly-barrier.png', palette: palettes.white },
];

for (const card of cardFiles) {
  const filePath = path.join(cardsDir, card.name);
  if (!fs.existsSync(filePath)) {
    const [r, g, b] = card.palette;
    const png = createPng(320, 220, r, g, b);
    fs.writeFileSync(filePath, png);
    console.log(`Created template MS Paint canvas: ${card.name}`);
  }
}
