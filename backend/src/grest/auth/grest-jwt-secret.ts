import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';

// I token delle famiglie Grest NON devono valere sulle rotte admin del portale:
// JwtAuthGuard accetta qualsiasi JWT firmato con JWT_SECRET, quindi qui si usa un
// segreto diverso (GREST_JWT_SECRET, oppure derivato da JWT_SECRET se non impostato).
export function grestJwtSecret(config: ConfigService): string {
  const esplicito = config.get<string>('GREST_JWT_SECRET');
  if (esplicito) return esplicito;
  return createHmac('sha256', config.getOrThrow<string>('JWT_SECRET'))
    .update('grest-famiglie')
    .digest('hex');
}
