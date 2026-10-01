import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AREA_KEY, RUOLI_KEY, UtenteAutenticato } from './ruoli';

describe('JwtAuthGuard (ruoli)', () => {
  const reflector = new Reflector();
  const guard = new JwtAuthGuard(reflector);
  // la parte passport (verifica del token) è testata altrove: qui solo i ruoli
  jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockResolvedValue(true);

  const ctx = (user: Partial<UtenteAutenticato>, meta: Record<string, unknown> = {}) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((k: unknown) => meta[k as string]);
    return {
      getHandler: () => ({}), getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: { aree: [], ...user } }) }),
    } as unknown as ExecutionContext;
  };

  it('defaults to admin only when the route declares no roles', async () => {
    await expect(guard.canActivate(ctx({ ruolo: 'admin' }))).resolves.toBe(true);
    for (const ruolo of ['responsabile', 'contributor', 'utente'] as const) {
      await expect(guard.canActivate(ctx({ ruolo }))).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it('honours @Ruoli', async () => {
    const meta = { [RUOLI_KEY]: ['admin', 'responsabile'] };
    await expect(guard.canActivate(ctx({ ruolo: 'responsabile' }, meta))).resolves.toBe(true);
    await expect(guard.canActivate(ctx({ ruolo: 'contributor' }, meta))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires the area from @PerArea for non-admins', async () => {
    const meta = { [RUOLI_KEY]: ['admin', 'responsabile'], [AREA_KEY]: 'grest' };
    await expect(guard.canActivate(ctx({ ruolo: 'responsabile', aree: ['coro'] }, meta))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(guard.canActivate(ctx({ ruolo: 'responsabile', aree: ['grest'] }, meta))).resolves.toBe(true);
    await expect(guard.canActivate(ctx({ ruolo: 'admin' }, meta))).resolves.toBe(true);
  });
});
