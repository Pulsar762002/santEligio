// Carica i contenuti estratti dal vecchio sito (pagine, gruppi, orari messe).
// Uso:  npm run seed:contenuti
// Idempotente: usa upsert sulle chiavi naturali (slug / nome / ordine),
// quindi può essere rieseguito senza creare duplicati.

import { NestFactory } from '@nestjs/core';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from './app.module';
import { Pagina } from './pagine/schemas/pagina.schema';
import { Gruppo } from './gruppi/schemas/gruppo.schema';
import { OrarioMessa } from './orari-messe/schemas/orario-messa.schema';
import { Strada } from './stradario/schemas/strada.schema';
import { PAGINE_SEED } from './seed-data/pagine';
import { GRUPPI_SEED } from './seed-data/gruppi';
import { ORARI_MESSE_SEED } from './seed-data/orari-messe';
import { STRADARIO_SEED } from './seed-data/stradario';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const pagine = app.get<Model<Pagina>>(getModelToken(Pagina.name));
    const gruppi = app.get<Model<Gruppo>>(getModelToken(Gruppo.name));
    const orari = app.get<Model<OrarioMessa>>(getModelToken(OrarioMessa.name));
    const stradario = app.get<Model<Strada>>(getModelToken(Strada.name));

    for (const p of PAGINE_SEED) {
      await pagine.updateOne({ slug: p.slug }, { $set: p }, { upsert: true });
    }
    console.log(`✅  Pagine: ${PAGINE_SEED.length} voci sincronizzate.`);

    for (const g of GRUPPI_SEED) {
      await gruppi.updateOne({ nome: g.nome }, { $set: g }, { upsert: true });
    }
    console.log(`✅  Gruppi: ${GRUPPI_SEED.length} voci sincronizzate.`);

    for (const o of ORARI_MESSE_SEED) {
      await orari.updateOne(
        { ordine: o.ordine },
        { $set: o },
        { upsert: true },
      );
    }
    console.log(`✅  Orari messe: ${ORARI_MESSE_SEED.length} voci sincronizzate.`);

    for (let i = 0; i < STRADARIO_SEED.length; i++) {
      const s = STRADARIO_SEED[i];
      await stradario.updateOne(
        { via: s.via },
        { $set: { ...s, ordine: i } },
        { upsert: true },
      );
    }
    console.log(`✅  Stradario: ${STRADARIO_SEED.length} voci sincronizzate.`);
  } finally {
    await app.close();
  }
}

seed().catch((err) => {
  console.error('❌  Seed contenuti fallito:', err);
  process.exit(1);
});
