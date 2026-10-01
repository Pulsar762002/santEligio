import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { grestJwtSecret } from './grest-jwt-secret';

export interface GrestUtente {
  iscrittoId: string;
  username: string;
}

@Injectable()
export class GrestJwtStrategy extends PassportStrategy(Strategy, 'grest-jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: grestJwtSecret(config),
    });
  }

  validate(payload: { sub: string; username: string; tipo: string }): GrestUtente {
    if (payload.tipo !== 'grest') throw new UnauthorizedException();
    return { iscrittoId: payload.sub, username: payload.username };
  }
}
