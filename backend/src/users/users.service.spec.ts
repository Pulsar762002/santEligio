import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

describe('UsersService (gestione utenti)', () => {
  let service: UsersService;
  const select = { lean: jest.fn() };
  const model = {
    create: jest.fn(), findById: jest.fn(), countDocuments: jest.fn(), find: jest.fn(),
  };
  const id = '64b7f0f0f0f0f0f0f0f0f0f0';
  const doc = (o: object) => ({ id, save: jest.fn(), deleteOne: jest.fn(), ...o });

  beforeEach(async () => {
    jest.clearAllMocks();
    model.findById.mockImplementation(() => Object.assign(Promise.resolve(null), { select: () => select }));
    const m = await Test.createTestingModule({
      providers: [UsersService, { provide: getModelToken(User.name), useValue: model }],
    }).compile();
    service = m.get(UsersService);
  });

  const base = { email: ' Coro@Esempio.it ', nome: 'Mario', password: 'password1' };

  it('creates responsabili with their areas and a hashed password', async () => {
    model.create.mockResolvedValue({ id });
    await service.crea({ ...base, ruolo: 'responsabile', aree: ['coro', 'coro'] });
    const creato = model.create.mock.calls[0][0];
    expect(creato).toMatchObject({ email: 'coro@esempio.it', ruolo: 'responsabile', aree: ['coro'] });
    expect(creato.password).not.toBe('password1');
  });

  it('requires at least one area for responsabili/contributor and none for admin/utente', async () => {
    await expect(service.crea({ ...base, ruolo: 'contributor', aree: [] })).rejects.toBeInstanceOf(BadRequestException);
    model.create.mockResolvedValue({ id });
    await service.crea({ ...base, ruolo: 'utente', aree: ['coro'] });
    expect(model.create.mock.calls[0][0].aree).toEqual([]);
  });

  it('does not give the Grest area to contributors', async () => {
    await expect(service.crea({ ...base, ruolo: 'contributor', aree: ['grest'] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps duplicate emails to 409', async () => {
    model.create.mockRejectedValue({ code: 11000 });
    await expect(service.crea({ ...base, ruolo: 'utente' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('never leaves the portal without an active admin', async () => {
    model.findById.mockResolvedValue(doc({ ruolo: 'admin', attivo: true, aree: [] }));
    model.countDocuments.mockResolvedValue(0);
    await expect(service.modifica(id, { ruolo: 'utente' }, 'altro')).rejects.toBeInstanceOf(BadRequestException);
    expect(model.countDocuments).toHaveBeenCalledWith({ _id: { $ne: id }, ruolo: 'admin', attivo: true });
    await expect(service.elimina(id, 'altro')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids demoting or deleting yourself', async () => {
    model.findById.mockResolvedValue(doc({ ruolo: 'admin', attivo: true, aree: [] }));
    await expect(service.modifica(id, { attivo: false }, id)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.elimina(id, id)).rejects.toBeInstanceOf(BadRequestException);
  });
});
