import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UtenteAutenticato } from '../auth/ruoli';
import { UsersService } from './users.service';
import { CreaUtenteDto, ModificaUtenteDto, PasswordDto } from './dto/utente.dto';

// Gestione utenti del portale: solo admin (default di JwtAuthGuard).
@UseGuards(JwtAuthGuard)
@Controller('utenti')
export class UtentiController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  elenco() {
    return this.users.elenco();
  }

  @Get('aree')
  aree() {
    return this.users.aree();
  }

  @Post()
  crea(@Body() dto: CreaUtenteDto) {
    return this.users.crea(dto);
  }

  @Patch(':id')
  modifica(@Param('id') id: string, @Body() dto: ModificaUtenteDto, @Req() req: Request) {
    return this.users.modifica(id, dto, (req.user as UtenteAutenticato).userId);
  }

  @Put(':id/password')
  password(@Param('id') id: string, @Body() dto: PasswordDto) {
    return this.users.impostaPassword(id, dto.password);
  }

  @Delete(':id')
  elimina(@Param('id') id: string, @Req() req: Request) {
    return this.users.elimina(id, (req.user as UtenteAutenticato).userId);
  }
}
