import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';
import { Media } from './schemas/media.schema';
import { UtenteAutenticato } from '../auth/ruoli';

const u = (ruolo: UtenteAutenticato['ruolo'], userId = 'u1'): UtenteAutenticato =>
  ({ userId, email: 'x@y.it', nome: 'X', ruolo, aree: ['coro'] });

describe('MediaService.remove', () => {
  let service: MediaService;
  const model = { findById: jest.fn() };
  const ID = '64b7f0f0f0f0f0f0f0f0f0f0';
  const file = (o: object) => ({ filename: 'non-esiste.jpg', deleteOne: jest.fn(), ...o });

  beforeEach(async () => {
    jest.clearAllMocks();
    const m = await Test.createTestingModule({
      providers: [MediaService, { provide: getModelToken(Media.name), useValue: model }],
    }).compile();
    service = m.get(MediaService);
  });

  it('lets the admin delete any file, also the historical ones without owner', async () => {
    const f = file({});
    model.findById.mockResolvedValue(f);
    await service.remove(ID, u('admin'));
    expect(f.deleteOne).toHaveBeenCalled();
  });

  it('lets responsabili/contributor delete only their own uploads', async () => {
    const mio = file({ caricatoDa: 'u1' });
    model.findById.mockResolvedValue(mio);
    await service.remove(ID, u('contributor'));
    expect(mio.deleteOne).toHaveBeenCalled();

    const altrui = file({ caricatoDa: 'u2' });
    model.findById.mockResolvedValue(altrui);
    await expect(service.remove(ID, u('responsabile'))).rejects.toBeInstanceOf(ForbiddenException);
    const storico = file({});
    model.findById.mockResolvedValue(storico);
    await expect(service.remove(ID, u('responsabile'))).rejects.toBeInstanceOf(ForbiddenException);
    expect(altrui.deleteOne).not.toHaveBeenCalled();
    expect(storico.deleteOne).not.toHaveBeenCalled();
  });

  it('404 for unknown ids', async () => {
    await expect(service.remove('nope', u('admin'))).rejects.toBeInstanceOf(NotFoundException);
  });
});
