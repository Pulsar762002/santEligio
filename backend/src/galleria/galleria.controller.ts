import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { GalleriaService } from './galleria.service';
import {
  CreateCategoriaDto, UpdateCategoriaDto, CreateItemDto, UpdateItemDto,
} from './dto/galleria.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('galleria')
export class GalleriaController {
  constructor(private readonly galleriaService: GalleriaService) {}

  // --- categorie (le rotte specifiche prima di :id degli item) ---
  @Get('categorie')
  findCategorie() {
    return this.galleriaService.findCategorie();
  }

  @UseGuards(JwtAuthGuard)
  @Post('categorie')
  createCategoria(@Body() dto: CreateCategoriaDto) {
    return this.galleriaService.createCategoria(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('categorie/:id')
  updateCategoria(@Param('id') id: string, @Body() dto: UpdateCategoriaDto) {
    return this.galleriaService.updateCategoria(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('categorie/:id')
  removeCategoria(@Param('id') id: string) {
    return this.galleriaService.removeCategoria(id);
  }

  // --- item (foto/video) ---
  @Get()
  findItems(@Query('categoria') categoria?: string) {
    return this.galleriaService.findItems(categoria);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createItem(@Body() dto: CreateItemDto) {
    return this.galleriaService.createItem(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.galleriaService.updateItem(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  removeItem(@Param('id') id: string) {
    return this.galleriaService.removeItem(id);
  }
}
