import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { CalendarioAttivitaService, weekdaysFromGiorno } from './calendario-attivita.service';
import { CalendarioAttivita, FonteAttivita, TipoAttivita } from './schemas/calendario-attivita.schema';
import { OrarioMessa } from '../orari-messe/schemas/orario-messa.schema';
import { Evento } from '../eventi/schemas/evento.schema';

describe('weekdaysFromGiorno', () => {
  it('maps single weekday names', () => {
    expect(weekdaysFromGiorno('Lunedì')).toEqual([1]);
    expect(weekdaysFromGiorno('Martedì')).toEqual([2]);
    expect(weekdaysFromGiorno('Mercoledì')).toEqual([3]);
    expect(weekdaysFromGiorno('Giovedì')).toEqual([4]);
    expect(weekdaysFromGiorno('Venerdì')).toEqual([5]);
  });

  it('maps "Sabato e prefestivi" to Saturday and "Domenica e festivi" to Sunday', () => {
    expect(weekdaysFromGiorno('Sabato e prefestivi')).toEqual([6]);
    expect(weekdaysFromGiorno('Domenica e festivi')).toEqual([0]);
  });

  it('returns an empty array for unrecognized text', () => {
    expect(weekdaysFromGiorno('Ferragosto')).toEqual([]);
  });
});

describe('CalendarioAttivitaService', () => {
  let service: CalendarioAttivitaService;
  const calendarioModel = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    exists: jest.fn(),
  };
  const orarioModel = { find: jest.fn() };
  const eventoModel = { find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        CalendarioAttivitaService,
        { provide: getModelToken(CalendarioAttivita.name), useValue: calendarioModel },
        { provide: getModelToken(OrarioMessa.name), useValue: orarioModel },
        { provide: getModelToken(Evento.name), useValue: eventoModel },
      ],
    }).compile();
    service = moduleRef.get(CalendarioAttivitaService);
  });

  describe('findAll', () => {
    it('filters by month range and pubblicato=true by default', () => {
      const sort = jest.fn();
      calendarioModel.find.mockReturnValue({ sort });
      service.findAll(2026, 8);

      const filter = calendarioModel.find.mock.calls[0][0];
      expect(filter.pubblicato).toBe(true);
      expect(filter.data.$gte).toBeInstanceOf(Date);
      expect(filter.data.$lt).toBeInstanceOf(Date);
      expect(sort).toHaveBeenCalledWith({ data: 1, ora: 1 });
    });

    it('does not filter by pubblicato when tutti=true', () => {
      calendarioModel.find.mockReturnValue({ sort: jest.fn() });
      service.findAll(2026, 8, true);
      const filter = calendarioModel.find.mock.calls[0][0];
      expect(filter.pubblicato).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when missing', async () => {
      calendarioModel.findById.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('always forces fonte=manuale and clears fonteRifId', () => {
      calendarioModel.create.mockResolvedValue({});
      service.create({ data: '2026-08-10', ora: '10:00', titolo: 'Riunione' } as any);
      expect(calendarioModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ fonte: FonteAttivita.MANUALE, fonteRifId: undefined }),
      );
    });
  });

  describe('update / remove', () => {
    it('update throws NotFoundException when missing', async () => {
      calendarioModel.findByIdAndUpdate.mockResolvedValue(null);
      await expect(service.update('x', {})).rejects.toBeInstanceOf(NotFoundException);
    });

    it('remove throws NotFoundException when missing', async () => {
      calendarioModel.findByIdAndDelete.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('generaMese', () => {
    it('creates one entry per (date, ora) pair for a recurring mass, skipping duplicates', async () => {
      orarioModel.find.mockResolvedValue([
        { _id: 'orario1', giorno: 'Domenica e festivi', ora: '8:30, 11:00', chiesa: 'Chiesa Madre', note: '', attivo: true },
      ]);
      eventoModel.find.mockResolvedValue([]);
      calendarioModel.exists.mockResolvedValue(null);
      calendarioModel.create.mockResolvedValue({});
      calendarioModel.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      await service.generaMese(2026, 8);

      expect(calendarioModel.create).toHaveBeenCalled();
      for (const call of calendarioModel.create.mock.calls) {
        expect(call[0]).toMatchObject({
          fonte: FonteAttivita.MESSA,
          fonteRifId: 'orario1',
          tipo: TipoAttivita.MESSA,
          titolo: 'Santa Messa',
          luogo: 'Chiesa Madre',
        });
        expect(['8:30', '11:00']).toContain(call[0].ora);
        expect(call[0].data.getDay()).toBe(0); // Sunday
      }
    });

    it('does not recreate a mass entry that already exists for that date/ora', async () => {
      orarioModel.find.mockResolvedValue([
        { _id: 'orario1', giorno: 'Lunedì', ora: '8:30', attivo: true },
      ]);
      eventoModel.find.mockResolvedValue([]);
      calendarioModel.exists.mockResolvedValue({ _id: 'already' });
      calendarioModel.create.mockResolvedValue({});
      calendarioModel.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      await service.generaMese(2026, 8);

      expect(calendarioModel.create).not.toHaveBeenCalled();
    });

    it('creates one entry per published evento in the month, skipping ones already generated', async () => {
      orarioModel.find.mockResolvedValue([]);
      eventoModel.find.mockResolvedValue([
        { _id: 'evento1', titolo: 'Sagra', luogo: 'Piazza', dataInizio: new Date('2026-08-15T18:00:00Z') },
      ]);
      calendarioModel.exists.mockResolvedValue(null);
      calendarioModel.create.mockResolvedValue({});
      calendarioModel.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      await service.generaMese(2026, 8);

      expect(calendarioModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fonte: FonteAttivita.EVENTO,
          fonteRifId: 'evento1',
          tipo: TipoAttivita.EVENTO,
          titolo: 'Sagra',
          luogo: 'Piazza',
        }),
      );
    });

    it('returns the full month list via findAll', async () => {
      orarioModel.find.mockResolvedValue([]);
      eventoModel.find.mockResolvedValue([]);
      const finalList = [{ _id: 'x' }];
      calendarioModel.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(finalList) });

      const result = await service.generaMese(2026, 8);
      expect(result).toBe(finalList);
    });
  });
});
