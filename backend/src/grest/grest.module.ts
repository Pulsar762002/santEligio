import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GrestIscritto, GrestIscrittoSchema } from './schemas/grest-iscritto.schema';
import { GrestService } from './grest.service';
import { GrestPdfService } from './grest-pdf.service';
import { GrestMailService } from './grest-mail.service';
import { GrestAdminController, GrestController } from './grest.controller';
import { GrestJwtStrategy } from './auth/grest-jwt.strategy';
import { grestJwtSecret } from './auth/grest-jwt-secret';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: GrestIscritto.name, schema: GrestIscrittoSchema }]),
    PassportModule,
    // JwtService locale al modulo: firma con il segreto delle famiglie, non con JWT_SECRET.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: grestJwtSecret(config),
        signOptions: { expiresIn: config.get<string>('GREST_JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [GrestService, GrestPdfService, GrestMailService, GrestJwtStrategy],
  controllers: [GrestController, GrestAdminController],
})
export class GrestModule {}
