import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.attivo === false) return null;
    const valid = await this.usersService.validatePassword(password, user.password);
    return valid ? user : null;
  }

  login(user: UserDocument) {
    const payload = { sub: user.id, email: user.email, ruolo: user.ruolo };
    // ruolo nel token solo come indicazione per l'interfaccia: il server lo rilegge dal DB
    return { access_token: this.jwtService.sign(payload) };
  }
}
