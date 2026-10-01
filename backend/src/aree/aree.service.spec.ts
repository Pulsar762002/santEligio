import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AreeService } from './aree.service';
import { Proposta } from './schemas/proposta.schema';
import { Pagina } from '../pagine/schemas/pagina.schema';
import { Gruppo } from '../gruppi/schemas/gruppo.schema';
import { Evento } from '../eventi/schemas/evento.schema';
import { UtenteAutenticato } from '../auth/ruoli';

const u = (ruolo: UtenteAutenticato['ruolo'], aree: string[] = []): UtenteAutenticato =>
  ({ userId: 'u1', email: 'x@y.it', nome: 'X', ruolo, aree });

describe('AreeService', () => {
  let service: AreeService;
  const proposte = { create: jest.fn(), findById: jest.fn(), find: jest.fn() };
  const pagine = { findOneAndUpdate: jest.fn(), findOne: jest.fn() };
  const gruppi = { findOneAndUpdate: jest.fn(), findOne: jest.fn() };
  const eventi = { create: jest.fn(), findById: jest.fn(), find: jest.fn() };
  const contenuto = { titolo: 'Coro', contenuto: '<p>ciao</p>' };
  const ID = '64b7f0f0f0f0f0f0f0f0f0f0';

  beforeEach(async () => {
    jest.clearAllMocks();
    const m = await Test.createTestingModule({
      providers: [
        AreeService,
        { provide: getModelToken(Proposta.name), useValue: proposte },
        { provide: getModelToken(Pagina.name), useValue: pagine },
        { provide: getModelToken(Gruppo.name), useValue: gruppi },
        { provide: getModelToken(Evento.name), useValue: eventi },
      ],
    }).compile();
    service = m.get(AreeService);
  });

  it('responsabile publishes the page directly, creating it if missing', async () => {
    pagine.findOneAndUpdate.mockResolvedValue({ slug: 'coro' });
    const r = await service.salvaContenuto('coro', contenuto, u('responsabile', ['coro']));
    expect(r.inAttesa).toBe(false);
    const [filtro, update, opts] = pagine.findOneAndUpdate.mock.calls[0];
    expect(filtro).toEqual({ slug: 'coro' });
    expect(update.$setOnInsert).toMatchObject({ slug: 'coro', sezione: 'organismi', pubblicato: true });
    expect(opts).toMatchObject({ upsert: true });
    expect(proposte.create).not.toHaveBeenCalled();
  });

  it('contributor only creates a proposal and the public page is untouched', async () => {
    proposte.create.mockResolvedValue({ _id: 'p1' });
    const r = await service.salvaContenuto('coro', contenuto, u('contributor', ['coro']));
    expect(r.inAttesa).toBe(true);
    expect(pagine.findOneAndUpdate).not.toHaveBeenCalled();
    expect(proposte.create.mock.calls[0][0]).toMatchObject({ tipo: 'contenuto', area: 'coro', stato: 'in_attesa', autoreId: 'u1' });
  });

  it('refuses areas not assigned, unknown areas and the Grest area', async () => {
    await expect(service.salvaContenuto('coro', contenuto, u('responsabile', ['lettori']))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.salvaContenuto('boh', contenuto, u('admin'))).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.salvaContenuto('grest', contenuto, u('responsabile', ['grest']))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('events are tagged with the area; contributors cannot delete', async () => {
    eventi.create.mockResolvedValue({});
    await service.creaEvento('coro', { titolo: 'Concerto', dataInizio: '2026-12-24T21:00:00Z', area: 'lettori' }, u('responsabile', ['coro']));
    expect(eventi.create.mock.calls[0][0].area).toBe('coro');
    await expect(service.eliminaEvento('coro', ID, u('contributor', ['coro']))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('events of another area are not reachable', async () => {
    eventi.findById.mockResolvedValue({ area: 'lettori' });
    await expect(service.modificaEvento('coro', ID, { titolo: 'x' }, u('responsabile', ['coro']))).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('approvazioni', () => {
    const proposta = (o: object) => ({ area: 'coro', stato: 'in_attesa', save: jest.fn().mockReturnThis(), ...o });

    it('the area responsabile approves and the change is applied', async () => {
      const p = proposta({ tipo: 'contenuto', azione: 'modifica', dati: contenuto });
      proposte.findById.mockResolvedValue(p);
      pagine.findOneAndUpdate.mockResolvedValue({});
      await service.approva(ID, u('responsabile', ['coro']));
      expect(pagine.findOneAndUpdate).toHaveBeenCalled();
      expect(p).toMatchObject({ stato: 'approvata', decisoDa: 'X' });
    });

    it('approving a new event creates it in the area', async () => {
      proposte.findById.mockResolvedValue(proposta({ tipo: 'evento', azione: 'crea', dati: { titolo: 'E' } }));
      eventi.create.mockResolvedValue({});
      await service.approva(ID, u('admin'));
      expect(eventi.create).toHaveBeenCalledWith({ titolo: 'E', area: 'coro' });
    });

    it('other areas responsabili and contributors cannot decide; decided proposals are final', async () => {
      proposte.findById.mockResolvedValue(proposta({ tipo: 'contenuto' }));
      await expect(service.approva(ID, u('responsabile', ['lettori']))).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.approva(ID, u('contributor', ['coro']))).rejects.toBeInstanceOf(ForbiddenException);
      proposte.findById.mockResolvedValue(proposta({ stato: 'rifiutata' }));
      await expect(service.rifiuta(ID, 'no', u('admin'))).rejects.toBeInstanceOf(ConflictException);
    });

    it('lists proposals by role', () => {
      const chain = { sort: () => ({ limit: () => ({ lean: () => [] }) }) };
      proposte.find.mockReturnValue(chain);
      service.proposteVisibili(u('responsabile', ['coro']), 'in_attesa');
      expect(proposte.find).toHaveBeenLastCalledWith({ area: { $in: ['coro'] }, stato: 'in_attesa' });
      service.proposteVisibili(u('contributor', ['coro']));
      expect(proposte.find).toHaveBeenLastCalledWith({ autoreId: 'u1' });
      service.proposteVisibili(u('admin'));
      expect(proposte.find).toHaveBeenLastCalledWith({});
    });
  });
});
