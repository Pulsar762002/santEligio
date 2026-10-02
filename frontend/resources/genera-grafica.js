// Genera tutta la grafica dell'app dal dipinto del patrono (src/assets/santeligio-patrono.jpg):
//   node resources/genera-grafica.js        (da frontend/, con sharp di node_modules)
// poi: npx capacitor-assets generate --android --iconBackgroundColor '#7a1c14' \
//         --splashBackgroundColor '#2D5884' --splashBackgroundColorDark '#2D5884'   (Node >= 22)
// Le coordinate dei tagli si riferiscono all'originale 900x1055 (volto, berretto e aureola del santo).

const sharp = require('sharp');
const SRC = require("path").join(__dirname, "../src/assets/santeligio-patrono.jpg");
const OUT = __dirname;
const BLU = '#2D5884';                    // --color-primary-dark del sito
const quadrato = (l, t, w, size) =>
  sharp(SRC).extract({ left: l, top: t, width: w, height: w }).resize(size, size, { kernel: 'lanczos3' });

(async () => {
  // Icona classica e Play Store: taglio stretto su volto, berretto e aureola.
  await quadrato(370, 250, 320, 1024).png().toFile(`${OUT}/icon-only.png`);
  // Icona adattiva: taglio più largo, il launcher mostra solo il ~66% centrale.
  await quadrato(385, 265, 290, 1024).png().toFile(`${OUT}/icon-foreground.png`);
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#7a1c14' } }).png().toFile(`${OUT}/icon-background.png`);

  // Schermata di avvio: medaglione rotondo + nome, su blu del sito.
  const D = 1000;
  const medaglione = await quadrato(370, 250, 320, D)
    .composite([{ input: Buffer.from(`<svg width="${D}" height="${D}"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2}" fill="#fff"/></svg>`), blend: 'dest-in' }])
    .png().toBuffer();
  const anello = Buffer.from(`<svg width="${D + 40}" height="${D + 40}"><circle cx="${(D + 40) / 2}" cy="${(D + 40) / 2}" r="${(D + 40) / 2 - 4}" fill="none" stroke="#C9A227" stroke-width="8"/></svg>`);
  const testo = Buffer.from(`<svg width="2732" height="300"><text x="1366" y="190" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="120" fill="#ffffff">Parrocchia di Sant'Eligio</text></svg>`);
  for (const nome of ['splash', 'splash-dark']) {
    await sharp({ create: { width: 2732, height: 2732, channels: 4, background: BLU } })
      .composite([
        { input: medaglione, left: 866, top: 666 },
        { input: anello, left: 846, top: 646 },
        { input: testo, left: 0, top: 1720 },
      ]).png().toFile(`${OUT}/${nome}.png`);
  }
  console.log('sorgenti generate');
})().then(grafica);

// Grafica per la scheda Google Play → docs/play-store/grafica/
async function grafica() {
  await sharp(`${OUT}/icon-only.png`).resize(512, 512, { kernel: 'lanczos3' }).png().toFile(`${STORE}/icona-512.png`);
  // dipinto intero a sinistra (altezza piena), testo a destra su blu del sito
  const dipinto = await sharp(SRC).resize({ height: 500 }).png().toBuffer();
  const larghezzaDipinto = (await sharp(dipinto).metadata()).width;   // ~427
  const x = larghezzaDipinto + 50;
  const testo = Buffer.from(`<svg width="1024" height="500">
    <rect x="${larghezzaDipinto}" y="0" width="6" height="500" fill="#C9A227"/>
    <text x="${x}" y="190" font-family="DejaVu Sans, sans-serif" font-size="46" font-weight="bold" fill="#ffffff">Parrocchia di</text>
    <text x="${x}" y="248" font-family="DejaVu Sans, sans-serif" font-size="46" font-weight="bold" fill="#ffffff">Sant'Eligio</text>
    <text x="${x}" y="306" font-family="DejaVu Sans, sans-serif" font-size="26" fill="#d7e3e3">Roma · Fosso dell'Osa</text>
    <text x="${x}" y="360" font-family="DejaVu Sans, sans-serif" font-size="22" fill="#ffffff">Notizie, eventi, orari delle Messe</text>
    <text x="${x}" y="392" font-family="DejaVu Sans, sans-serif" font-size="22" fill="#ffffff">e iscrizioni al Grest</text>
  </svg>`);
  await sharp({ create: { width: 1024, height: 500, channels: 3, background: '#2D5884' } })
    .composite([{ input: dipinto, left: 0, top: 0 }, { input: testo, left: 0, top: 0 }])
    .png().toFile(`${STORE}/immagine-in-evidenza-1024x500.png`);
  console.log('ok');
}
const STORE = require('path').join(__dirname, '../../docs/play-store/grafica');
