import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CalendarioIntestazioniService } from './calendario-intestazioni.service';
import { CalendarioIntestazione } from './schemas/calendario-intestazione.schema';

const exec = <T>(value: T) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('CalendarioIntestazioniService', () => {
  let service: CalendarioIntestazioniService;
  const model = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        CalendarioIntestazioniService,
        { provide: getModelToken(CalendarioIntestazione.name), useValue: model },
      ],
    }).compile();
    service = moduleRef.get(CalendarioIntestazioniService);
  });

  it('trova cerca per anno/mese', async () => {
    const doc = { anno: 2026, mese: 10, titolo: 'Mese missionario' };
    model.findOne.mockReturnValue(exec(doc));
    await expect(service.trova(2026, 10)).resolves.toBe(doc);
    expect(model.findOne).toHaveBeenCalledWith({ anno: 2026, mese: 10 });
  });

  it('salva fa upsert con testi ripuliti dagli spazi', async () => {
    const doc = { anno: 2026, mese: 10, titolo: 'Titolo', descrizione: 'Testo' };
    model.findOneAndUpdate.mockReturnValue(exec(doc));
    await expect(service.salva(2026, 10, { titolo: '  Titolo ', descrizione: 'Testo  ' })).resolves.toBe(doc);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { anno: 2026, mese: 10 },
      { $set: { titolo: 'Titolo', descrizione: 'Testo' } },
      expect.objectContaining({ upsert: true, new: true }),
    );
    expect(model.deleteOne).not.toHaveBeenCalled();
  });

  it('salva con titolo e descrizione vuoti rimuove l\'intestazione', async () => {
    model.deleteOne.mockReturnValue(exec({ deletedCount: 1 }));
    await expect(service.salva(2026, 10, { titolo: '  ', descrizione: '' })).resolves.toBeNull();
    expect(model.deleteOne).toHaveBeenCalledWith({ anno: 2026, mese: 10 });
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
