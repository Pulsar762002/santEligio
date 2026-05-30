// Crea l'utente admin iniziale.
// Uso:  ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed
// Idempotente: se l'utente esiste già non fa nulla.

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function seed() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌  ADMIN_EMAIL e ADMIN_PASSWORD sono obbligatori.');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const users = app.get(UsersService);
    const existing = await users.findByEmail(email);

    if (existing) {
      console.log(`ℹ️   Utente ${email} già presente, nessuna azione.`);
    } else {
      await users.create(email, password);
      console.log(`✅  Utente admin ${email} creato.`);
    }
  } finally {
    await app.close();
  }
}

seed().catch((err) => {
  console.error('❌  Seed fallito:', err);
  process.exit(1);
});
