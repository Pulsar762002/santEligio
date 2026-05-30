import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { OrariMesseService } from './orari-messe.service';
import { OrarioMessa, TipoMessa } from './schemas/orario-messa.schema';

describe('OrariMesseService', () => {
  let service: OrariMesseService;
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
        OrariMesseService,
        { provide: getModelToken(OrarioMessa.name), useValue: model },
      ],
    }).compile();
    service = moduleRef.get(OrariMesseService);
  });

  describe('findAll', () => {
    it('filters by attivo=true and sorts by ordine then ora', () => {
      const sort = jest.fn();
      model.find.mockReturnValue({ sort });
      service.findAll();
      expect(model.find).toHaveBeenCalledWith({ attivo: true });
      expect(sort).toHaveBeenCalledWith({ ordine: 1, ora: 1 });
    });

    it('adds the tipo filter when provided', () => {
      model.find.mockReturnValue({ sort: jest.fn() });
      service.findAll(TipoMessa.FESTIVA);
      expect(model.find).toHaveBeenCalledWith({
        attivo: true,
        tipo: TipoMessa.FESTIVA,
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when missing', async () => {
      model.findById.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the document when found', async () => {
      const doc = { _id: '1', giorno: 'Domenica' };
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
