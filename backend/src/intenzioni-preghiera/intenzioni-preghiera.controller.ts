import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { IntenzioniPreghieraService } from './intenzioni-preghiera.service';
import { CreateIntenzionePreghieraDto } from './dto/create-intenzione-preghiera.dto';
import { UpdateIntenzionePreghieraDto } from './dto/update-intenzione-preghiera.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('intenzioni-preghiera')
export class IntenzioniPreghieraController {
  constructor(private readonly intenzioniService: IntenzioniPreghieraService) {}

  // Pubblico: chiunque può lasciare un'intenzione di preghiera.
  @Post()
  create(@Body() dto: CreateIntenzionePreghieraDto) {
    return this.intenzioniService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.intenzioniService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIntenzionePreghieraDto) {
    return this.intenzioniService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.intenzioniService.remove(id);
  }
}
