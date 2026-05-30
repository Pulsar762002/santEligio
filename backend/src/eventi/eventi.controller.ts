import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { EventiService } from './eventi.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('eventi')
export class EventiController {
  constructor(private readonly eventiService: EventiService) {}

  @Get()
  findAll(@Query('tutti') tutti?: string) {
    return this.eventiService.findAll(tutti !== 'true');
  }

  @Get('prossimi')
  findProssimi(@Query('limit') limit?: string) {
    return this.eventiService.findProssimi(limit ? +limit : 5);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventiService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateEventoDto) {
    return this.eventiService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventoDto) {
    return this.eventiService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventiService.remove(id);
  }
}
