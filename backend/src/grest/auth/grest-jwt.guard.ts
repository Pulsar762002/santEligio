import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protegge l'area famiglie del Grest (token emesso da POST /api/grest/login). */
@Injectable()
export class GrestJwtGuard extends AuthGuard('grest-jwt') {}
