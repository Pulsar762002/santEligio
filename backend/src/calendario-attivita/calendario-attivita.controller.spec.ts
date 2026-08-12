import { Test } from '@nestjs/testing';
import { CalendarioAttivitaController } from './calendario-attivita.controller';
import { CalendarioAttivitaService } from './calendario-attivita.service';

describe('CalendarioAttivitaController', () => {
  let controller: CalendarioAttivitaController;
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    generaMese: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [CalendarioAttivitaController],
      providers: [{ provide: CalendarioAttivitaService, useValue: service }],
    }).compile();
    controller = moduleRef.get(CalendarioAttivitaController);
  });

  describe('findAll', () => {
    it('defaults anno/mese to the current month and tutti to false', () => {
      const now = new Date();
      controller.findAll(undefined, undefined, undefined);
      expect(service.findAll).toHaveBeenCalledWith(now.getFullYear(), now.getMonth() + 1, false);
    });

    it('parses anno/mese/tutti from the query', () => {
      controller.findAll('2026', '8', 'true');
      expect(service.findAll).toHaveBeenCalledWith(2026, 8, true);
    });
  });

  it('findOne delegates to the service', () => {
    controller.findOne('abc');
    expect(service.findOne).toHaveBeenCalledWith('abc');
  });

  it('create delegates the dto to the service', () => {
    const dto = { data: '2026-08-10', ora: '10:00', titolo: 'Riunione' } as any;
    controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  describe('genera', () => {
    it('defaults anno/mese to the current month', () => {
      const now = new Date();
      controller.genera(undefined, undefined);
      expect(service.generaMese).toHaveBeenCalledWith(now.getFullYear(), now.getMonth() + 1);
    });

    it('parses anno/mese from the query', () => {
      controller.genera('2026', '8');
      expect(service.generaMese).toHaveBeenCalledWith(2026, 8);
    });
  });

  it('update delegates id and dto to the service', () => {
    controller.update('abc', { titolo: 'Nuovo' } as any);
    expect(service.update).toHaveBeenCalledWith('abc', { titolo: 'Nuovo' });
  });

  it('remove delegates to the service', () => {
    controller.remove('abc');
    expect(service.remove).toHaveBeenCalledWith('abc');
  });
});
