import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CalendarioIntestazioniController } from './calendario-intestazioni.controller';
import { CalendarioIntestazioniService } from './calendario-intestazioni.service';

describe('CalendarioIntestazioniController', () => {
  let controller: CalendarioIntestazioniController;
  const service = { trova: jest.fn(), salva: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [CalendarioIntestazioniController],
      providers: [{ provide: CalendarioIntestazioniService, useValue: service }],
    }).compile();
    controller = moduleRef.get(CalendarioIntestazioniController);
  });

  it('trova usa il mese corrente di default', () => {
    const now = new Date();
    controller.trova(undefined, undefined);
    expect(service.trova).toHaveBeenCalledWith(now.getFullYear(), now.getMonth() + 1);
  });

  it('trova legge anno/mese dalla query', () => {
    controller.trova('2026', '10');
    expect(service.trova).toHaveBeenCalledWith(2026, 10);
  });

  it('salva delega al service', () => {
    const dto = { titolo: 'T', descrizione: 'D' };
    controller.salva(dto, '2026', '10');
    expect(service.salva).toHaveBeenCalledWith(2026, 10, dto);
  });

  it('rifiuta un mese non valido', () => {
    expect(() => controller.trova('2026', '13')).toThrow(BadRequestException);
  });
});
