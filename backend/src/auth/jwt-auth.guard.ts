import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AREA_KEY, RUOLI_KEY, Ruolo, UtenteAutenticato, haArea } from './ruoli';

// Autenticazione + ruolo. Per sicurezza il default è "solo admin": le rotte aperte
// anche ad altri ruoli lo dichiarano con @Ruoli(...) (ed eventualmente @PerArea(...)).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    await super.canActivate(ctx);
    const targets = [ctx.getHandler(), ctx.getClass()];
    const ammessi = this.reflector.getAllAndOverride<Ruolo[]>(RUOLI_KEY, targets) ?? ['admin'];
    const area = this.reflector.getAllAndOverride<string>(AREA_KEY, targets);
    const user = ctx.switchToHttp().getRequest().user as UtenteAutenticato;
    if (!ammessi.includes(user.ruolo) || (area && !haArea(user, area))) {
      throw new ForbiddenException('Operazione non consentita per il tuo ruolo.');
    }
    return true;
  }
}
