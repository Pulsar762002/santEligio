import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { EventiService } from './eventi.service';
import { Evento } from './schemas/evento.schema';

describe('EventiService', () => {
  let service: EventiService;
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
        EventiService,
        { provide: getModelToken(Evento.name), useValue: model },
      ],
    }).compile();
    service = moduleRef.get(EventiService);
  });

  describe('findAll', () => {
    it('filters by pubblicato=true and sorts by dataInizio asc by default', () => {
      const sort = jest.fn();
      model.find.mockReturnValue({ sort });
      service.findAll();
      expect(model.find).toHaveBeenCalledWith({ pubblicato: true });
      expect(sort).toHaveBeenCalledWith({ dataInizio: 1 });
    });

    it('returns all events when soloPublicati is false', () => {
      model.find.mockReturnValue({ sort: jest.fn() });
      service.findAll(false);
      expect(model.find).toHaveBeenCalledWith({});
    });
  });

  describe('findProssimi', () => {
    it('filters future published events and applies the limit', () => {
      const limit = jest.fn();
      const sort = jest.fn().mockReturnValue({ limit });
      model.find.mockReturnValue({ sort });
      service.findProssimi(3);

      const filter = model.find.mock.calls[0][0];
      expect(filter.pubblicato).toBe(true);
      expect(filter.dataInizio.$gte).toBeInstanceOf(Date);
      expect(sort).toHaveBeenCalledWith({ dataInizio: 1 });
      expect(limit).toHaveBeenCalledWith(3);
    });

    it('defaults the limit to 5', () => {
      const limit = jest.fn();
      model.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ limit }) });
      service.findProssimi();
      expect(limit).toHaveBeenCalledWith(5);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when missing', async () => {
      model.findById.mockResolvedValue(null);
      await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the document when found', async () => {
      const doc = { _id: '1', titolo: 'Festa' };
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
