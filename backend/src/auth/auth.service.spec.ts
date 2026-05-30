import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let auth: AuthService;
  const users = {
    findByEmail: jest.fn(),
    validatePassword: jest.fn(),
  };
  const jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    auth = moduleRef.get(AuthService);
  });

  describe('validateUser', () => {
    it('returns null when the user does not exist', async () => {
      users.findByEmail.mockResolvedValue(null);
      expect(await auth.validateUser('nope@x.it', 'pw')).toBeNull();
      expect(users.validatePassword).not.toHaveBeenCalled();
    });

    it('returns null when the password is wrong', async () => {
      users.findByEmail.mockResolvedValue({ password: 'hash' });
      users.validatePassword.mockResolvedValue(false);
      expect(await auth.validateUser('a@x.it', 'wrong')).toBeNull();
    });

    it('returns the user when credentials are valid', async () => {
      const user = { id: '1', email: 'a@x.it', password: 'hash' };
      users.findByEmail.mockResolvedValue(user);
      users.validatePassword.mockResolvedValue(true);
      expect(await auth.validateUser('a@x.it', 'right')).toBe(user);
    });
  });

  describe('login', () => {
    it('signs a token with sub and email', () => {
      const result = auth.login({ id: '42', email: 'a@x.it' } as any);
      expect(jwt.sign).toHaveBeenCalledWith({ sub: '42', email: 'a@x.it' });
      expect(result).toEqual({ access_token: 'signed.jwt.token' });
    });
  });
});
