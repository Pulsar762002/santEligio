import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  // File caricati (immagini/PDF). In produzione li serve Nginx dal volume condiviso;
  // qui servono al dev server quando si accede direttamente al backend.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? [
            'https://parrocchiasanteligio.it',
            'https://www.parrocchiasanteligio.it',
            // App Capacitor (Android/iOS): la WebView carica i file locali
            // da queste origini e chiama l'API sul dominio reale.
            'https://localhost',
            'capacitor://localhost',
          ]
        : '*',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend in ascolto sulla porta ${port}`);
}
bootstrap();
