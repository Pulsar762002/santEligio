import { Controller, Get } from '@nestjs/common';
import { StradarioService } from './stradario.service';

@Controller('stradario')
export class StradarioController {
  constructor(private readonly stradarioService: StradarioService) {}

  @Get()
  findAll() {
    return this.stradarioService.findAll();
  }
}
