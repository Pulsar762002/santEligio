import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { OrariMesseService } from './orari-messe.service';
import { CreateOrarioMessaDto } from './dto/create-orario-messa.dto';
import { UpdateOrarioMessaDto } from './dto/update-orario-messa.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TipoMessa } from './schemas/orario-messa.schema';

@Controller('orari-messe')
export class OrariMesseController {
  constructor(private readonly orariMesseService: OrariMesseService) {}

  @Get()
  findAll(
    @Query('tipo') tipo?: TipoMessa,
    @Query('tutti') tutti?: string,
  ) {
    return this.orariMesseService.findAll(tipo, tutti !== 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orariMesseService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOrarioMessaDto) {
    return this.orariMesseService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrarioMessaDto) {
    return this.orariMesseService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orariMesseService.remove(id);
  }
}
