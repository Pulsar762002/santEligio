import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NewsModule } from './news/news.module';
import { EventiModule } from './eventi/eventi.module';
import { OrariMesseModule } from './orari-messe/orari-messe.module';
import { StradarioModule } from './stradario/stradario.module';
import { MediaModule } from './media/media.module';
import { GalleriaModule } from './galleria/galleria.module';
import { PagineModule } from './pagine/pagine.module';
import { GruppiModule } from './gruppi/gruppi.module';
import { IntenzioniPreghieraModule } from './intenzioni-preghiera/intenzioni-preghiera.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    NewsModule,
    EventiModule,
    OrariMesseModule,
    StradarioModule,
    MediaModule,
    GalleriaModule,
    PagineModule,
    GruppiModule,
    IntenzioniPreghieraModule,
  ],
})
export class AppModule {}
