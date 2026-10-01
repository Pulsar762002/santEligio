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
    expect(proposte.create.mock.calls[0][0]).toMatchObject({ tipo: 'contenuto', aree: ['coro'], stato: 'in_attesa', autoreId: 'u1' });
  });

  it('the Contatti page is an area: its responsabile edits the existing page', async () => {
    pagine.findOneAndUpdate.mockResolvedValue({ slug: 'contatti' });
    const r = await service.salvaContenuto('contatti', { titolo: 'Contatti', contenuto: '<p>Turni</p>' }, u('responsabile', ['contatti']));
    expect(r.inAttesa).toBe(false);
    const [filtro, update] = pagine.findOneAndUpdate.mock.calls[0];
    expect(filtro).toEqual({ slug: 'contatti' });
    // sezione/pubblicazione della pagina esistente non vengono toccate ($setOnInsert vale solo se manca)
    expect(update.$set).toEqual({ titolo: 'Contatti', sottotitolo: '', contenuto: '<p>Turni</p>', immagine: '' });
  });

  it('refuses areas not assigned, unknown areas and the Grest area', async () => {
    await expect(service.salvaContenuto('coro', contenuto, u('responsabile', ['lettori']))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.salvaContenuto('boh', contenuto, u('admin'))).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.salvaContenuto('grest', contenuto, u('responsabile', ['grest']))).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('eventi con più aree', () => {
    const evento = (aree: string[]) => ({ id: ID, titolo: 'E', aree, set: jest.fn(function (this: any, d: any) { Object.assign(this, d); }), save: jest.fn(function (this: any) { return this; }), deleteOne: jest.fn() });

    it('admin creates events with any areas, or none', async () => {
      eventi.create.mockImplementation(async (d) => d);
      await service.creaEvento({ titolo: 'A', dataInizio: '2026-12-01T10:00:00Z', aree: ['coro', 'caritas', 'coro'] }, u('admin'));
      expect(eventi.create.mock.calls[0][0].aree).toEqual(['coro', 'caritas']);
      await service.creaEvento({ titolo: 'B', dataInizio: '2026-12-01T10:00:00Z' }, u('admin'));
      expect(eventi.create.mock.calls[1][0].aree).toEqual([]);
    });

    it('responsabili must pick at least one of their own areas', async () => {
      const dto = { titolo: 'A', dataInizio: '2026-12-01T10:00:00Z' };
      await expect(service.creaEvento({ ...dto, aree: [] }, u('responsabile', ['coro']))).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.creaEvento({ ...dto, aree: ['coro', 'lettori'] }, u('responsabile', ['coro']))).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.creaEvento({ ...dto, aree: ['grest'] }, u('responsabile', ['grest']))).rejects.toBeInstanceOf(ForbiddenException);
      eventi.create.mockImplementation(async (d) => d);
      const r = await service.creaEvento({ ...dto, aree: ['coro'] }, u('responsabile', ['coro', 'lettori']));
      expect(r.inAttesa).toBe(false);
    });

    it('contributors create a proposal involving their chosen areas', async () => {
      proposte.create.mockResolvedValue({});
      const r = await service.creaEvento({ titolo: 'A', dataInizio: '2026-12-01T10:00:00Z', aree: ['coro'] }, u('contributor', ['coro']));
      expect(r.inAttesa).toBe(true);
      expect(eventi.create).not.toHaveBeenCalled();
      expect(proposte.create.mock.calls[0][0]).toMatchObject({ tipo: 'evento', azione: 'crea', aree: ['coro'] });
    });

    it('editing a shared event keeps the other areas', async () => {
      const e = evento(['coro', 'caritas']);
      eventi.findById.mockResolvedValue(e);
      await service.modificaEvento(ID, { aree: ['lettori'] }, u('responsabile', ['coro', 'lettori']));
      expect(e.aree).toEqual(['caritas', 'lettori']);
    });

    it('events without any of my areas are not reachable (historical events = admin only)', async () => {
      eventi.findById.mockResolvedValue(evento(['caritas']));
      await expect(service.modificaEvento(ID, { titolo: 'x' }, u('responsabile', ['coro']))).rejects.toBeInstanceOf(NotFoundException);
      eventi.findById.mockResolvedValue(evento([]));
      await expect(service.modificaEvento(ID, { titolo: 'x' }, u('responsabile', ['coro']))).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cannot leave an event without areas', async () => {
      eventi.findById.mockResolvedValue(evento(['coro']));
      await expect(service.modificaEvento(ID, { aree: [] }, u('responsabile', ['coro']))).rejects.toBeInstanceOf(BadRequestException);
    });

    it('delete: admin always, responsabile only if all areas are his, contributor never', async () => {
      const condiviso = evento(['coro', 'caritas']);
      eventi.findById.mockResolvedValue(condiviso);
      await expect(service.eliminaEvento(ID, u('responsabile', ['coro']))).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.eliminaEvento(ID, u('contributor', ['coro']))).rejects.toBeInstanceOf(ForbiddenException);
      const mio = evento(['coro']);
      eventi.findById.mockResolvedValue(mio);
      await service.eliminaEvento(ID, u('responsabile', ['coro']));
      expect(mio.deleteOne).toHaveBeenCalled();
      eventi.findById.mockResolvedValue(condiviso);
      await service.eliminaEvento(ID, u('admin'));
      expect(condiviso.deleteOne).toHaveBeenCalled();
    });

    it('lists only the events of my areas', () => {
      const chain = { sort: () => ({ lean: () => [] }) };
      eventi.find.mockReturnValue(chain);
      service.eventiGestibili(u('responsabile', ['coro', 'lettori']));
      expect(eventi.find).toHaveBeenLastCalledWith({ aree: { $in: ['coro', 'lettori'] } });
      service.eventiGestibili(u('admin'), 'coro');
      expect(eventi.find).toHaveBeenLastCalledWith({ aree: 'coro' });
    });
  });

  describe('approvazioni', () => {
    const proposta = (o: object) => ({ aree: ['coro'], stato: 'in_attesa', save: jest.fn().mockReturnThis(), ...o });

    it('the area responsabile approves and the change is applied', async () => {
      const p = proposta({ tipo: 'contenuto', azione: 'modifica', dati: contenuto });
      proposte.findById.mockResolvedValue(p);
      pagine.findOneAndUpdate.mockResolvedValue({});
      await service.approva(ID, u('responsabile', ['coro']));
      expect(pagine.findOneAndUpdate).toHaveBeenCalled();
      expect(p).toMatchObject({ stato: 'approvata', decisoDa: 'X' });
    });

    it('approving a new event creates it in the area', async () => {
      proposte.findById.mockResolvedValue(proposta({ tipo: 'evento', azione: 'crea', dati: { titolo: 'E', aree: ['coro', 'lettori'] } }));
      eventi.create.mockResolvedValue({});
      await service.approva(ID, u('admin'));
      expect(eventi.create).toHaveBeenCalledWith({ titolo: 'E', aree: ['coro', 'lettori'] });
    });

    it('a responsabile of any involved area can approve', async () => {
      proposte.findById.mockResolvedValue(proposta({ aree: ['coro', 'lettori'], tipo: 'evento', azione: 'crea', dati: {} }));
      eventi.create.mockResolvedValue({});
      await expect(service.approva(ID, u('responsabile', ['lettori']))).resolves.toBeDefined();
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
      expect(proposte.find).toHaveBeenLastCalledWith({ aree: { $in: ['coro'] }, stato: 'in_attesa' });
      service.proposteVisibili(u('contributor', ['coro']));
      expect(proposte.find).toHaveBeenLastCalledWith({ autoreId: 'u1' });
      service.proposteVisibili(u('admin'));
      expect(proposte.find).toHaveBeenLastCalledWith({});
    });
  });
});
