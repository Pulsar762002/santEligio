import { Test } from '@nestjs/testing';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { CategoriaNews } from './schemas/news.schema';

describe('NewsController', () => {
  let controller: NewsController;
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
      controllers: [NewsController],
      providers: [{ provide: NewsService, useValue: service }],
    }).compile();
    controller = moduleRef.get(NewsController);
  });

  describe('findAll', () => {
    it('requests only published news by default (tutti undefined)', () => {
      controller.findAll(CategoriaNews.CARITAS, undefined);
      expect(service.findAll).toHaveBeenCalledWith(CategoriaNews.CARITAS, true);
    });

    it('requests all news when tutti=true', () => {
      controller.findAll(undefined, 'true');
      expect(service.findAll).toHaveBeenCalledWith(undefined, false);
    });
  });

  it('findOne delegates to the service', () => {
    controller.findOne('abc');
    expect(service.findOne).toHaveBeenCalledWith('abc');
  });

  it('create delegates the dto to the service', () => {
    const dto = { titolo: 'T', testo: 'X' } as any;
    controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
