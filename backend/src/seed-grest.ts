// Importa gli iscritti del vecchio portale Grest (SQLite) nella collection grest_iscritti.
// Uso:  npm run seed:grest -- /percorso/export-grest.json
// Il JSON ha la forma { users: [...], autorizzazioni: [...], deleghe: [...] } con le righe
// delle tabelle users / autorizzazioneUtente / delegaUtente (es. `sqlite3 -json`).
//
// Idempotente: gli iscritti già importati (stesso legacyId) non vengono toccati.
// Le password in chiaro del vecchio DB vengono cifrate con bcrypt: ognuno accede con la
// stessa password di prima. Alla fine ogni documento viene riletto e confrontato con l'export.

import { readFileSync } from 'fs';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './app.module';
import { GrestIscritto } from './grest/schemas/grest-iscritto.schema';
import { ExportLegacy, IscrittoLegacy, mappaExport } from './grest/grest-legacy';

const CAMPI_CONFRONTATI: (keyof IscrittoLegacy)[] = [
  'username', 'attivo', 'activationToken', 'nomePadre', 'cognomePadre', 'emailPadre',
  'mobilePhonePadre', 'nomeMadre', 'cognomeMadre', 'emailMadre', 'mobilePhoneMadre', 'nomeFiglio',
  'cognomeFiglio', 'natoA', 'natoIl', 'residenteA', 'via', 'annoCatechismo', 'annoElementari',
  'taglia', 'altroContatto', 'mobilePhoneAltro', 'altroDaSegnalare', 'uscita1', 'uscita2',
  'consenso', 'autorizzazione', 'delega',
];

const norm = (v: unknown) => JSON.stringify(v ?? null);

async function seed() {
  const file = process.argv[2] ?? process.env.GREST_IMPORT_FILE;
  if (!file) {
    console.error('❌  Indica il file JSON: npm run seed:grest -- export-grest.json');
    process.exit(1);
  }
  const iscritti = mappaExport(JSON.parse(readFileSync(file, 'utf8')) as ExportLegacy);
  console.log(`📄  Export: ${iscritti.length} iscritti, ` +
    `${iscritti.filter((i) => i.autorizzazione).length} autorizzazioni, ` +
    `${iscritti.filter((i) => i.delega).length} deleghe`);

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const model = app.get<Model<GrestIscritto>>(getModelToken(GrestIscritto.name));
    await model.syncIndexes();

    let creati = 0;
    let giaPresenti = 0;
    for (const { passwordInChiaro, ...i } of iscritti) {
      if (await model.exists({ legacyId: i.legacyId })) {
        giaPresenti++;
        continue;
      }
      await model.create({ ...i, password: await bcrypt.hash(passwordInChiaro, 10) });
      creati++;
    }
    console.log(`✅  Creati ${creati}, già presenti ${giaPresenti}`);

    // Verifica: ogni iscritto dell'export deve esistere con gli stessi dati e la stessa password.
    const errori: string[] = [];
    for (const atteso of iscritti) {
      const doc = await model.findOne({ legacyId: atteso.legacyId }).lean();
      if (!doc) {
        errori.push(`legacyId ${atteso.legacyId}: mancante`);
        continue;
      }
      for (const campo of CAMPI_CONFRONTATI) {
        if (norm(doc[campo as keyof typeof doc]) !== norm(atteso[campo])) {
          errori.push(`legacyId ${atteso.legacyId} (${atteso.username}): campo ${campo} diverso`);
        }
      }
      if (!doc.password || !(await bcrypt.compare(atteso.passwordInChiaro, doc.password))) {
        errori.push(`legacyId ${atteso.legacyId} (${atteso.username}): password non corrisponde`);
      }
    }
    const conLegacy = await model.countDocuments({ legacyId: { $exists: true } });
    console.log(`🔎  Verifica: ${iscritti.length} attesi, ${conLegacy} importati in Mongo, ${errori.length} differenze`);
    if (errori.length) {
      errori.slice(0, 50).forEach((e) => console.error('   ✗ ' + e));
      process.exitCode = 2;
    }
  } finally {
    await app.close();
  }
}

seed().catch((err) => {
  console.error('❌  Import Grest fallito:', err);
  process.exit(1);
});
