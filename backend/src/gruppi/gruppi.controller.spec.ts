import { Test } from '@nestjs/testing';
import { GruppiController } from './gruppi.controller';
import { GruppiService } from './gruppi.service';
import { AreaGruppo } from './schemas/gruppo.schema';

describe('GruppiController', () => {
  let controller: GruppiController;
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
      controllers: [GruppiController],
      providers: [{ provide: GruppiService, useValue: service }],
    }).compile();
    controller = moduleRef.get(GruppiController);
  });

  describe('findAll', () => {
    it('requests only published groups by default (tutti undefined)', () => {
      controller.findAll(AreaGruppo.LITURGIA, undefined);
      expect(service.findAll).toHaveBeenCalledWith(AreaGruppo.LITURGIA, true);
    });

    it('requests all groups when tutti=true', () => {
      controller.findAll(undefined, 'true');
      expect(service.findAll).toHaveBeenCalledWith(undefined, false);
    });
  });

  it('findOne delegates to the service', () => {
    controller.findOne('abc');
    expect(service.findOne).toHaveBeenCalledWith('abc');
  });

  it('create delegates the dto to the service', () => {
    const dto = { nome: 'Coro', area: AreaGruppo.LITURGIA } as any;
    controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
