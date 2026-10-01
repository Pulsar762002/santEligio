import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UtenteAutenticato } from './ruoli';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Ruolo e aree si leggono dal DB a ogni richiesta: un cambio di ruolo o una
  // disattivazione hanno effetto subito, senza aspettare la scadenza del token.
  async validate(payload: { sub: string }): Promise<UtenteAutenticato> {
    const u = await this.users.findById(payload.sub);
    if (!u || u.attivo === false) throw new UnauthorizedException();
    return { userId: u.id, email: u.email, nome: u.nome ?? '', ruolo: u.ruolo, aree: u.aree ?? [] };
  }
}
