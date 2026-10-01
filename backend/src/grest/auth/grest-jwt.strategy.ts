import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { grestJwtSecret } from './grest-jwt-secret';
import { GrestService } from '../grest.service';

export interface GrestUtente {
  iscrittoId: string;
  username: string;
}

@Injectable()
export class GrestJwtStrategy extends PassportStrategy(Strategy, 'grest-jwt') {
  constructor(
    config: ConfigService,
    private readonly grest: GrestService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: grestJwtSecret(config),
    });
  }

  // Ricontrolla a ogni richiesta: chi viene escluso (accesso ristretto o account
  // eliminato/disattivato) perde l'accesso subito, non alla scadenza del token.
  async validate(payload: { sub: string; username: string; tipo: string }): Promise<GrestUtente> {
    if (payload.tipo !== 'grest' || !(await this.grest.puoAccedere(payload.sub))) {
      throw new UnauthorizedException();
    }
    return { iscrittoId: payload.sub, username: payload.username };
  }
}
