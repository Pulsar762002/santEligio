import { Test } from '@nestjs/testing';
import { OrariMesseController } from './orari-messe.controller';
import { OrariMesseService } from './orari-messe.service';
import { TipoMessa } from './schemas/orario-messa.schema';

describe('OrariMesseController', () => {
  let controller: OrariMesseController;
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [OrariMesseController],
      providers: [{ provide: OrariMesseService, useValue: service }],
    }).compile();
    controller = moduleRef.get(OrariMesseController);
  });

  describe('findAll', () => {
    it('passes through the tipo filter', () => {
      controller.findAll(TipoMessa.PREFESTIVA);
      expect(service.findAll).toHaveBeenCalledWith(TipoMessa.PREFESTIVA);
    });

    it('passes undefined when no tipo is given', () => {
      controller.findAll(undefined);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  it('findOne delegates to the service', () => {
    controller.findOne('abc');
    expect(service.findOne).toHaveBeenCalledWith('abc');
  });

  it('create delegates the dto to the service', () => {
    const dto = { giorno: 'Domenica', ora: '10:00' } as any;
    controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
