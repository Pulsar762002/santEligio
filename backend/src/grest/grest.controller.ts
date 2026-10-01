import {
  Body, Controller, Delete, Get, Header, Param, ParseEnumPipe, Patch, Post, Put, Query, Req, Res, StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GrestService } from './grest.service';
import { GrestPdfService } from './grest-pdf.service';
import { RegistrazioneDto } from './dto/registrazione.dto';
import { IscrizioneDto } from './dto/iscrizione.dto';
import { AutorizzazioneDto } from './dto/autorizzazione.dto';
import { DelegaDto } from './dto/delega.dto';
import { AttivazioneDto, CambioPasswordDto, CancellazioneDto, GrestLoginDto } from './dto/credenziali.dto';
import { GrestJwtGuard } from './auth/grest-jwt.guard';
import { GrestUtente } from './auth/grest-jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MODULI, ModuloGrest } from './grest.constants';
import { iscrittiCsv } from './grest-csv';
import { AbilitatoDto, ImpostazioniDto } from './dto/impostazioni.dto';
import { AutorizzazioneAdminDto, DelegaAdminDto, IscrizioneAdminDto } from './dto/admin.dto';
import { PerArea, Ruoli } from '../auth/ruoli';

const moduloPipe = new ParseEnumPipe(Object.fromEntries(MODULI.map((m) => [m, m])));

function pdf(res: Response, buffer: Buffer, nome: string): StreamableFile {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${nome}"`,
    'Cache-Control': 'no-store',
  });
  return new StreamableFile(buffer);
}

// ── Pubblico + area famiglie: /api/grest/... ────────────────
@Controller('grest')
export class GrestController {
  constructor(
    private readonly grest: GrestService,
    private readonly pdfService: GrestPdfService,
  ) {}

  @Get('stato')
  stato() {
    return this.grest.stato();
  }

  @Post('registrazione')
  registra(@Body() dto: RegistrazioneDto) {
    return this.grest.registra(dto);
  }

  @Get('attivazione')
  @Header('Cache-Control', 'no-store')
  infoAttivazione(@Query('token') token: string) {
    return this.grest.infoAttivazione(token);
  }

  @Post('attivazione')
  attiva(@Body() dto: AttivazioneDto) {
    return this.grest.attiva(dto);
  }

  @Post('login')
  login(@Body() dto: GrestLoginDto) {
    return this.grest.login(dto.username, dto.password);
  }

  @UseGuards(GrestJwtGuard)
  @Get('me')
  @Header('Cache-Control', 'no-store')
  me(@Req() req: Request) {
    return this.grest.me((req.user as GrestUtente).iscrittoId);
  }

  @UseGuards(GrestJwtGuard)
  @Put('me/iscrizione')
  iscrizione(@Req() req: Request, @Body() dto: IscrizioneDto) {
    return this.grest.aggiornaIscrizione((req.user as GrestUtente).iscrittoId, dto);
  }

  @UseGuards(GrestJwtGuard)
  @Put('me/autorizzazione')
  autorizzazione(@Req() req: Request, @Body() dto: AutorizzazioneDto) {
    return this.grest.aggiornaAutorizzazione((req.user as GrestUtente).iscrittoId, dto);
  }

  @UseGuards(GrestJwtGuard)
  @Put('me/delega')
  delega(@Req() req: Request, @Body() dto: DelegaDto) {
    return this.grest.aggiornaDelega((req.user as GrestUtente).iscrittoId, dto);
  }

  @UseGuards(GrestJwtGuard)
  @Put('me/password')
  password(@Req() req: Request, @Body() dto: CambioPasswordDto) {
    return this.grest.cambiaPassword((req.user as GrestUtente).iscrittoId, dto);
  }

  @UseGuards(GrestJwtGuard)
  @Post('me/cancellazione')
  richiediCancellazione(@Req() req: Request, @Body() dto: CancellazioneDto) {
    return this.grest.richiediCancellazione((req.user as GrestUtente).iscrittoId, dto.motivo);
  }

  @UseGuards(GrestJwtGuard)
  @Delete('me/cancellazione')
  annullaCancellazione(@Req() req: Request) {
    return this.grest.annullaCancellazione((req.user as GrestUtente).iscrittoId);
  }

  @UseGuards(GrestJwtGuard)
  @Get('me/moduli/:modulo')
  async modulo(
    @Req() req: Request,
    @Param('modulo', moduloPipe) modulo: ModuloGrest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const iscritto = await this.grest.perModulo((req.user as GrestUtente).iscrittoId, modulo);
    return pdf(res, await this.pdfService.genera(modulo, iscritto), `modulo_${modulo}.pdf`);
  }
}

// ── Amministrazione: admin del portale e Responsabili con l'area "grest" ──
@UseGuards(JwtAuthGuard)
@Ruoli('admin', 'responsabile')
@PerArea('grest')
@Controller('grest/admin')
export class GrestAdminController {
  constructor(
    private readonly grest: GrestService,
    private readonly pdfService: GrestPdfService,
  ) {}

  @Get('impostazioni')
  @Header('Cache-Control', 'no-store')
  impostazioni() {
    return this.grest.impostazioni();
  }

  @Put('impostazioni')
  aggiornaImpostazioni(@Body() dto: ImpostazioniDto) {
    return this.grest.aggiornaImpostazioni(dto);
  }

  @Get('iscritti')
  @Header('Cache-Control', 'no-store')
  elenco() {
    return this.grest.elenco();
  }

  @Get('iscritti.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="iscritti-grest.csv"')
  @Header('Cache-Control', 'no-store')
  async csv() {
    return iscrittiCsv(await this.grest.elenco());
  }

  @Get('iscritti/:id')
  @Header('Cache-Control', 'no-store')
  dettaglio(@Param('id') id: string) {
    return this.grest.dettaglio(id);
  }

  @Get('iscritti/:id/moduli/:modulo')
  async modulo(
    @Param('id') id: string,
    @Param('modulo', moduloPipe) modulo: ModuloGrest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const iscritto = await this.grest.perModulo(id, modulo);
    const nome = `${modulo}_${iscritto.cognomeFiglio}_${iscritto.nomeFiglio}.pdf`.replace(/[^\w.-]+/g, '_');
    return pdf(res, await this.pdfService.genera(modulo, iscritto), nome);
  }

  @Patch('iscritti/:id/abilitato')
  abilitato(@Param('id') id: string, @Body() dto: AbilitatoDto) {
    return this.grest.impostaAbilitato(id, dto.abilitato);
  }

  @Put('iscritti/:id/iscrizione')
  iscrizione(@Param('id') id: string, @Body() dto: IscrizioneAdminDto) {
    return this.grest.aggiornaIscrizioneAdmin(id, dto);
  }

  @Put('iscritti/:id/autorizzazione')
  autorizzazione(@Param('id') id: string, @Body() dto: AutorizzazioneAdminDto) {
    return this.grest.aggiornaAutorizzazioneAdmin(id, dto);
  }

  @Put('iscritti/:id/delega')
  delega(@Param('id') id: string, @Body() dto: DelegaAdminDto) {
    return this.grest.aggiornaDelegaAdmin(id, dto);
  }

  @Post('iscritti/:id/link-password')
  linkPassword(@Param('id') id: string) {
    return this.grest.inviaLinkPassword(id);
  }

  @Delete('iscritti/:id')
  elimina(@Param('id') id: string) {
    return this.grest.elimina(id);
  }
}
