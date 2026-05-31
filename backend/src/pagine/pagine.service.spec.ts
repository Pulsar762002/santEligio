import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { PagineService } from './pagine.service';
import { Pagina, SezionePagina } from './schemas/pagina.schema';

describe('PagineService', () => {
  let service: PagineService;
  const model = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PagineService,
        { provide: getModelToken(Pagina.name), useValue: model },
      ],
    }).compile();
    service = moduleRef.get(PagineService);
  });

  describe('findAll', () => {
    it('filters by pubblicato=true by default and sorts by sezione/ordine', () => {
      const sort = jest.fn();
      model.find.mockReturnValue({ sort });
      service.findAll();
      expect(model.find).toHaveBeenCalledWith({ pubblicato: true });
      expect(sort).toHaveBeenCalledWith({ sezione: 1, ordine: 1 });
    });

    it('adds the sezione filter when provided', () => {
      model.find.mockReturnValue({ sort: jest.fn() });
      service.findAll(SezionePagina.CARITAS);
      expect(model.find).toHaveBeenCalledWith({
        pubblicato: true,
        sezione: SezionePagina.CARITAS,
      });
    });

    it('omits the pubblicato filter when soloPubblicate is false', () => {
      model.find.mockReturnValue({ sort: jest.fn() });
      service.findAll(undefined, false);
      expect(model.find).toHaveBeenCalledWith({});
    });
  });

  describe('findBySlug', () => {
    it('throws NotFoundException when missing', async () => {
      model.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('looks the page up by slug', async () => {
      const doc = { slug: 'storia', titolo: 'Storia' };
      model.findOne.mockResolvedValue(doc);
      expect(await service.findBySlug('storia')).toBe(doc);
      expect(model.findOne).toHaveBeenCalledWith({ slug: 'storia' });
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
