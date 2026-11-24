/**
 * Rasterizes assets/logo.svg into the PNG variants Expo needs.
 * Run with: npm run build:icons
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const LOGO_SVG = path.join(ASSETS, 'logo.svg');
const TEAL = { r: 15, g: 118, b: 110, alpha: 1 };

async function renderFromSvg(svgPath, outPath, width, height, background) {
  const buffer = await sharp(svgPath, { density: 384 })
    .resize(width, height, { fit: 'contain', background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(outPath, buffer);
  console.log(`wrote ${path.relative(ROOT, outPath)}  (${width}x${height})`);
}

async function renderForegroundOnTransparent(svgPath, outPath, size, paddingRatio = 0.18) {
  const inner = Math.round(size * (1 - paddingRatio * 2));
  const padded = await sharp(svgPath, { density: 384 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: Math.round((size - inner) / 2),
      bottom: Math.round((size - inner) / 2),
      left: Math.round((size - inner) / 2),
      right: Math.round((size - inner) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  fs.writeFileSync(outPath, padded);
  console.log(`wrote ${path.relative(ROOT, outPath)}  (${size}x${size})`);
}

async function renderSolid(outPath, size, color) {
  const buffer = await sharp({
    create: { width: size, height: size, channels: 4, background: color },
  })
    .png()
    .toBuffer();
  fs.writeFileSync(outPath, buffer);
  console.log(`wrote ${path.relative(ROOT, outPath)}  (${size}x${size}, solid)`);
}

(async () => {
  if (!fs.existsSync(LOGO_SVG)) {
    console.error(`Missing ${LOGO_SVG}`);
    process.exit(1);
  }
  // iOS / general app icon — opaque (the SVG already has a rounded teal bg)
  await renderFromSvg(LOGO_SVG, path.join(ASSETS, 'icon.png'), 1024, 1024);
  // Web favicon
  await renderFromSvg(LOGO_SVG, path.join(ASSETS, 'favicon.png'), 64, 64);
  // Splash image (centered logo on transparent)
  await renderForegroundOnTransparent(LOGO_SVG, path.join(ASSETS, 'splash-icon.png'), 1024, 0.2);
  // Android adaptive icon foreground (with safe-zone padding)
  await renderForegroundOnTransparent(LOGO_SVG, path.join(ASSETS, 'android-icon-foreground.png'), 1024, 0.22);
  // Android adaptive icon monochrome (foreground in black silhouette)
  await renderForegroundOnTransparent(LOGO_SVG, path.join(ASSETS, 'android-icon-monochrome.png'), 1024, 0.22);
  // Android adaptive icon background (solid teal)
  await renderSolid(path.join(ASSETS, 'android-icon-background.png'), 1024, TEAL);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
