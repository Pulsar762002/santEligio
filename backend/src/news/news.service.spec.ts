import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { NewsService } from './news.service';
import { News, CategoriaNews } from './schemas/news.schema';

describe('NewsService', () => {
  let service: NewsService;
  const model = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        NewsService,
        { provide: getModelToken(News.name), useValue: model },
      ],
    }).compile();
    service = moduleRef.get(NewsService);
  });

  describe('findAll', () => {
    it('filters by pubblicato=true by default', () => {
      const sort = jest.fn();
      model.find.mockReturnValue({ sort });
      service.findAll();
      expect(model.find).toHaveBeenCalledWith({ pubblicato: true });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('adds the categoria filter when provided', () => {
      model.find.mockReturnValue({ sort: jest.fn() });
      service.findAll(CategoriaNews.LITURGIA);
      expect(model.find).toHaveBeenCalledWith({
        pubblicato: true,
        categoria: CategoriaNews.LITURGIA,
      });
    });

    it('omits the pubblicato filter when soloPublicati is false', () => {
      model.find.mockReturnValue({ sort: jest.fn() });
      service.findAll(undefined, false);
      expect(model.find).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when missing', async () => {
      model.findById.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the document when found', async () => {
      const doc = { _id: '1', titolo: 'Ciao' };
      model.findById.mockResolvedValue(doc);
      expect(await service.findOne('1')).toBe(doc);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the id does not exist', async () => {
      model.findByIdAndUpdate.mockResolvedValue(null);
      await expect(service.update('x', {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the id does not exist', async () => {
      model.findByIdAndDelete.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
