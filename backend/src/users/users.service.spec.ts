import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { ConfigService } from '@nestjs/config';

describe('UsersService (gestione utenti)', () => {
  let service: UsersService;
  const select = { lean: jest.fn() };
  const model = {
    create: jest.fn(), findById: jest.fn(), countDocuments: jest.fn(), find: jest.fn(),
  };
  const id = '64b7f0f0f0f0f0f0f0f0f0f0';
  const doc = (o: object) => ({ id, email: 'altro@esempio.it', save: jest.fn(), deleteOne: jest.fn(), ...o });

  beforeEach(async () => {
    jest.clearAllMocks();
    model.findById.mockImplementation(() => Object.assign(Promise.resolve(null), { select: () => select }));
    const m = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: model },
        { provide: ConfigService, useValue: { get: (k: string) => (k === 'ADMIN_EMAIL' ? 'Admin@Santeligio.it' : undefined) } },
      ],
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
    expect(model.countDocuments).toHaveBeenCalledWith({ _id: { $ne: id }, ruolo: 'admin', attivo: { $ne: false } });
    await expect(service.elimina(id, 'altro')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists accounts created before roles with default name/areas/active', async () => {
    model.find.mockReturnValue({ select: () => ({ sort: () => ({ lean: () => Promise.resolve([
      { email: 'vecchio@x.it', ruolo: 'admin' },
      { email: 'nuovo@x.it', ruolo: 'contributor', nome: 'N', aree: ['coro'], attivo: false },
    ]) }) }) });
    await expect(service.elenco()).resolves.toEqual([
      { email: 'vecchio@x.it', ruolo: 'admin', nome: '', aree: [], attivo: true, protetto: false },
      { email: 'nuovo@x.it', ruolo: 'contributor', nome: 'N', aree: ['coro'], attivo: false, protetto: false },
    ]);
  });

  it('treats a missing "attivo" as active when protecting the last admin', async () => {
    model.findById.mockResolvedValue(doc({ ruolo: 'admin', aree: undefined }));
    model.countDocuments.mockResolvedValue(0);
    await expect(service.modifica(id, { ruolo: 'utente' }, 'altro')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('protects the main admin account (ADMIN_EMAIL) even when other admins exist', async () => {
    model.countDocuments.mockResolvedValue(5);
    const principale = doc({ email: 'admin@santeligio.it', ruolo: 'admin', attivo: true, aree: [] });
    model.findById.mockResolvedValue(principale);
    await expect(service.elimina(id, 'altro-admin')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.modifica(id, { attivo: false }, 'altro-admin')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.modifica(id, { ruolo: 'responsabile', aree: ['coro'] }, 'altro-admin')).rejects.toBeInstanceOf(BadRequestException);
    expect(principale.deleteOne).not.toHaveBeenCalled();
    expect(principale.save).not.toHaveBeenCalled();
  });

  it('still lets you rename the main account and change its password', async () => {
    const principale = doc({ email: 'admin@santeligio.it', ruolo: 'admin', attivo: true, aree: [] });
    model.findById.mockResolvedValue(principale);
    await service.impostaPassword(id, 'nuovapassword');
    expect(principale.save).toHaveBeenCalled();
  });

  it('forbids demoting or deleting yourself', async () => {
    model.findById.mockResolvedValue(doc({ ruolo: 'admin', attivo: true, aree: [] }));
    await expect(service.modifica(id, { attivo: false }, id)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.elimina(id, id)).rejects.toBeInstanceOf(BadRequestException);
  });
});
