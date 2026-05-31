import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { StradarioService } from './stradario.service';
import { CreateStradaDto } from './dto/create-strada.dto';
import { UpdateStradaDto } from './dto/update-strada.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stradario')
export class StradarioController {
  constructor(private readonly stradarioService: StradarioService) {}

  @Get()
  findAll() {
    return this.stradarioService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateStradaDto) {
    return this.stradarioService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStradaDto) {
    return this.stradarioService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stradarioService.remove(id);
  }
}
