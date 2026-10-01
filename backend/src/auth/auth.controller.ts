import { Body, Controller, Get, Header, Post, Put, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RUOLI, Ruoli, UtenteAutenticato } from './ruoli';
import { UsersService } from '../users/users.service';
import { CambioPasswordDto } from '../users/dto/utente.dto';
import { trovaArea } from '../aree/aree.registry';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private users: UsersService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req) {
    return this.authService.login(req.user);
  }

  /** Profilo dell'utente collegato (qualsiasi ruolo), con i nomi delle sue aree. */
  @UseGuards(JwtAuthGuard)
  @Ruoli(...RUOLI)
  @Get('me')
  @Header('Cache-Control', 'no-store')
  me(@Request() req) {
    const u = req.user as UtenteAutenticato;
    return { ...u, areeDettaglio: u.aree.map((k) => trovaArea(k)).filter(Boolean) };
  }

  @UseGuards(JwtAuthGuard)
  @Ruoli(...RUOLI)
  @Put('password')
  password(@Request() req, @Body() dto: CambioPasswordDto) {
    return this.users.cambiaPassword((req.user as UtenteAutenticato).userId, dto.attuale, dto.nuova);
  }
}
