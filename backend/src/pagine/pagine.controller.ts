import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { PagineService } from './pagine.service';
import { CreatePaginaDto } from './dto/create-pagina.dto';
import { UpdatePaginaDto } from './dto/update-pagina.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SezionePagina } from './schemas/pagina.schema';

@Controller('pagine')
export class PagineController {
  constructor(private readonly pagineService: PagineService) {}

  @Get()
  findAll(
    @Query('sezione') sezione?: SezionePagina,
    @Query('tutte') tutte?: string,
  ) {
    return this.pagineService.findAll(sezione, tutte !== 'true');
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.pagineService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreatePaginaDto) {
    return this.pagineService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePaginaDto) {
    return this.pagineService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pagineService.remove(id);
  }
}
