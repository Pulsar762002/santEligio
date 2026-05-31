import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { GruppiService } from './gruppi.service';
import { Gruppo, AreaGruppo } from './schemas/gruppo.schema';

describe('GruppiService', () => {
  let service: GruppiService;
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
        GruppiService,
        { provide: getModelToken(Gruppo.name), useValue: model },
      ],
    }).compile();
    service = moduleRef.get(GruppiService);
  });

  describe('findAll', () => {
    it('filters by pubblicato=true by default and sorts by area/ordine', () => {
      const sort = jest.fn();
      model.find.mockReturnValue({ sort });
      service.findAll();
      expect(model.find).toHaveBeenCalledWith({ pubblicato: true });
      expect(sort).toHaveBeenCalledWith({ area: 1, ordine: 1 });
    });

    it('adds the area filter when provided', () => {
      model.find.mockReturnValue({ sort: jest.fn() });
      service.findAll(AreaGruppo.CARITA);
      expect(model.find).toHaveBeenCalledWith({
        pubblicato: true,
        area: AreaGruppo.CARITA,
      });
    });

    it('omits the pubblicato filter when soloPubblicati is false', () => {
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
