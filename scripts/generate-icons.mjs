// Builds the PWA icons from the raccoon illustration (DESIGN.md, "סמל האפליקציה").
// Run once with `npm run icons`; the output files are committed.
import { writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "spec/raccoon.png";
const SOFT_BLUSH = "#FAD9E5";
// Keeps only the head (ears, face, whiskers and the paw on the cheek) of the
// 1321x1191 source; the body, raised arm, legs and tail are masked out.
const HEAD_MASK = `<svg xmlns="http://www.w3.org/2000/svg" width="1321" height="1191">
  <polygon fill="#fff" points="100,0 1180,0 1180,430 1060,440 1040,520 1000,610 890,666 840,690 720,736 600,736 500,723 400,691 290,631 212,627 175,700 150,760 100,760"/>
</svg>`;
// The face takes about 70% of the icon so rounded OS masks never cut it.
const FACE_RATIO = 0.7;

async function renderIcon(size) {
  const faceWidth = Math.round(size * FACE_RATIO);
  const head = await sharp(SOURCE)
    .composite([{ input: Buffer.from(HEAD_MASK), blend: "dest-in" }])
    .png()
    .toBuffer();
  const face = await sharp(head)
    .trim()
    .resize({ width: faceWidth, height: faceWidth, fit: "inside" })
    .png()
    .toBuffer();
  const { width, height } = await sharp(face).metadata();

  return sharp({
    create: { width: size, height: size, channels: 4, background: SOFT_BLUSH },
  })
    .composite([
      {
        input: face,
        left: Math.round((size - width) / 2),
        top: Math.round((size - height) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// sharp cannot write .ico, so the PNG images are wrapped in an ICO container.
function toIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

await mkdir("public/icons", { recursive: true });
await writeFile("public/icons/icon-192.png", await renderIcon(192));
await writeFile("public/icons/icon-512.png", await renderIcon(512));
await writeFile("src/app/apple-icon.png", await renderIcon(180));
await writeFile(
  "src/app/favicon.ico",
  toIco([
    { size: 16, data: await renderIcon(16) },
    { size: 32, data: await renderIcon(32) },
  ]),
);
console.log("Icons written.");
