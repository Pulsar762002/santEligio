import { Controller, Get, Put, Body, Query, UseGuards, BadRequestException, Header } from '@nestjs/common';
import { CalendarioIntestazioniService } from './calendario-intestazioni.service';
import { SalvaCalendarioIntestazioneDto } from './dto/salva-calendario-intestazione.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

function resolveAnnoMese(anno?: string, mese?: string) {
  const now = new Date();
  const a = anno ? +anno : now.getFullYear();
  const m = mese ? +mese : now.getMonth() + 1;
  if (!Number.isInteger(a) || !Number.isInteger(m) || m < 1 || m > 12) {
    throw new BadRequestException('anno/mese non validi');
  }
  return { anno: a, mese: m };
}

@Controller('calendario-intestazioni')
export class CalendarioIntestazioniController {
  constructor(private readonly intestazioniService: CalendarioIntestazioniService) {}

  // no-store: l'intestazione cambia dall'admin e il PDF deve leggere sempre quella attuale
  // (la risposta "null" è un body vuoto senza ETag, che il browser altrimenti può riusare dalla cache).
  @Get()
  @Header('Cache-Control', 'no-store')
  trova(@Query('anno') anno?: string, @Query('mese') mese?: string) {
    const { anno: a, mese: m } = resolveAnnoMese(anno, mese);
    return this.intestazioniService.trova(a, m);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  salva(
    @Body() dto: SalvaCalendarioIntestazioneDto,
    @Query('anno') anno?: string,
    @Query('mese') mese?: string,
  ) {
    const { anno: a, mese: m } = resolveAnnoMese(anno, mese);
    return this.intestazioniService.salva(a, m, dto);
  }
}
