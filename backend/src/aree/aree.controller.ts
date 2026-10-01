import {
  Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query, Req, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Ruoli, RUOLI_STAFF, UtenteAutenticato } from '../auth/ruoli';
import { AreeService } from './aree.service';
import { AREE } from './aree.registry';
import { ContenutoAreaDto, RifiutoDto } from './dto/contenuto-area.dto';
import { CreateEventoDto } from '../eventi/dto/create-evento.dto';
import { UpdateEventoDto } from '../eventi/dto/update-evento.dto';
import { StatoProposta } from './schemas/proposta.schema';

const utente = (req: Request) => req.user as UtenteAutenticato;

// Contenuti per area (Responsabili, Contributor, Admin): /api/aree/...
// L'accesso alla singola area è verificato nel service.
@UseGuards(JwtAuthGuard)
@Ruoli(...RUOLI_STAFF)
@Controller('aree')
export class AreeController {
  constructor(private readonly aree: AreeService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  mie(@Req() req: Request) {
    return this.aree.mie(utente(req));
  }

  /** Nomi di tutte le aree (per mostrare le aree degli eventi condivisi). */
  @Get('elenco')
  elenco() {
    return AREE;
  }

  @Get(':area/contenuto')
  @Header('Cache-Control', 'no-store')
  contenuto(@Param('area') area: string, @Req() req: Request) {
    return this.aree.contenuto(area, utente(req));
  }

  @Put(':area/contenuto')
  salvaContenuto(@Param('area') area: string, @Body() dto: ContenutoAreaDto, @Req() req: Request) {
    return this.aree.salvaContenuto(area, dto, utente(req));
  }
}

// Gestione eventi per ruolo (Admin, Responsabili, Contributor): /api/gestione/eventi
// Le regole su aree, approvazioni ed eliminazione sono nel service.
@UseGuards(JwtAuthGuard)
@Ruoli(...RUOLI_STAFF)
@Controller('gestione/eventi')
export class GestioneEventiController {
  constructor(private readonly aree: AreeService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  elenco(@Req() req: Request, @Query('area') area?: string) {
    return this.aree.eventiGestibili(utente(req), area || undefined);
  }

  @Post()
  crea(@Body() dto: CreateEventoDto, @Req() req: Request) {
    return this.aree.creaEvento(dto, utente(req));
  }

  @Patch(':id')
  modifica(@Param('id') id: string, @Body() dto: UpdateEventoDto, @Req() req: Request) {
    return this.aree.modificaEvento(id, dto, utente(req));
  }

  @Delete(':id')
  elimina(@Param('id') id: string, @Req() req: Request) {
    return this.aree.eliminaEvento(id, utente(req));
  }
}

@UseGuards(JwtAuthGuard)
@Ruoli(...RUOLI_STAFF)
@Controller('proposte')
export class ProposteController {
  constructor(private readonly aree: AreeService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  elenco(@Req() req: Request, @Query('stato') stato?: StatoProposta) {
    const valido = ['in_attesa', 'approvata', 'rifiutata'].includes(stato ?? '') ? stato : undefined;
    return this.aree.proposteVisibili(utente(req), valido);
  }

  @Ruoli('admin', 'responsabile')
  @Post(':id/approva')
  approva(@Param('id') id: string, @Req() req: Request) {
    return this.aree.approva(id, utente(req));
  }

  @Ruoli('admin', 'responsabile')
  @Post(':id/rifiuta')
  rifiuta(@Param('id') id: string, @Body() dto: RifiutoDto, @Req() req: Request) {
    return this.aree.rifiuta(id, dto.nota, utente(req));
  }
}
