import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { GruppiService } from './gruppi.service';
import { CreateGruppoDto } from './dto/create-gruppo.dto';
import { UpdateGruppoDto } from './dto/update-gruppo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AreaGruppo } from './schemas/gruppo.schema';

@Controller('gruppi')
export class GruppiController {
  constructor(private readonly gruppiService: GruppiService) {}

  @Get()
  findAll(
    @Query('area') area?: AreaGruppo,
    @Query('tutti') tutti?: string,
  ) {
    return this.gruppiService.findAll(area, tutti !== 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gruppiService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateGruppoDto) {
    return this.gruppiService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGruppoDto) {
    return this.gruppiService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gruppiService.remove(id);
  }
}
