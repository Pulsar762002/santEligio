import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { CalendarioAttivitaService } from './calendario-attivita.service';
import { CreateCalendarioAttivitaDto } from './dto/create-calendario-attivita.dto';
import { UpdateCalendarioAttivitaDto } from './dto/update-calendario-attivita.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

function resolveAnnoMese(anno?: string, mese?: string) {
  const now = new Date();
  return {
    anno: anno ? +anno : now.getFullYear(),
    mese: mese ? +mese : now.getMonth() + 1,
  };
}

@Controller('calendario-attivita')
export class CalendarioAttivitaController {
  constructor(private readonly calendarioAttivitaService: CalendarioAttivitaService) {}

  @Get()
  findAll(
    @Query('anno') anno?: string,
    @Query('mese') mese?: string,
    @Query('tutti') tutti?: string,
  ) {
    const { anno: a, mese: m } = resolveAnnoMese(anno, mese);
    return this.calendarioAttivitaService.findAll(a, m, tutti === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarioAttivitaService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateCalendarioAttivitaDto) {
    return this.calendarioAttivitaService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('genera')
  genera(@Query('anno') anno?: string, @Query('mese') mese?: string) {
    const { anno: a, mese: m } = resolveAnnoMese(anno, mese);
    return this.calendarioAttivitaService.generaMese(a, m);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCalendarioAttivitaDto) {
    return this.calendarioAttivitaService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calendarioAttivitaService.remove(id);
  }
}
