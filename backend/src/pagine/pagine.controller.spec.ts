import { Test } from '@nestjs/testing';
import { PagineController } from './pagine.controller';
import { PagineService } from './pagine.service';
import { SezionePagina } from './schemas/pagina.schema';

describe('PagineController', () => {
  let controller: PagineController;
  const service = {
    findAll: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [PagineController],
      providers: [{ provide: PagineService, useValue: service }],
    }).compile();
    controller = moduleRef.get(PagineController);
  });

  describe('findAll', () => {
    it('requests only published pages by default (tutte undefined)', () => {
      controller.findAll(SezionePagina.PARROCCHIA, undefined);
      expect(service.findAll).toHaveBeenCalledWith(SezionePagina.PARROCCHIA, true);
    });

    it('requests all pages when tutte=true', () => {
      controller.findAll(undefined, 'true');
      expect(service.findAll).toHaveBeenCalledWith(undefined, false);
    });
  });

  it('findOne resolves by slug', () => {
    controller.findOne('storia-parrocchia');
    expect(service.findBySlug).toHaveBeenCalledWith('storia-parrocchia');
  });

  it('create delegates the dto to the service', () => {
    const dto = { slug: 's', titolo: 'T', contenuto: 'X' } as any;
    controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
