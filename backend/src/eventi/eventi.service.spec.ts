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
    it('returns all events within the next 2 months when there are at least `limit` of them', async () => {
      const finestra = [{ _id: '1' }, { _id: '2' }, { _id: '3' }, { _id: '4' }];
      const sortFinestra = jest.fn().mockResolvedValue(finestra);
      model.find.mockReturnValueOnce({ sort: sortFinestra });

      const result = await service.findProssimi(3);

      const filter = model.find.mock.calls[0][0];
      expect(filter.pubblicato).toBe(true);
      expect(filter.dataInizio.$lte).toBeInstanceOf(Date);
      expect(sortFinestra).toHaveBeenCalledWith({ dataInizio: 1 });
      expect(model.find).toHaveBeenCalledTimes(1);
      expect(result).toBe(finestra);
    });

    it('falls back to the top `limit` events (beyond the window) when fewer than `limit` are within the next 2 months', async () => {
      const finestra = [{ _id: '1' }];
      const sortFinestra = jest.fn().mockResolvedValue(finestra);
      model.find.mockReturnValueOnce({ sort: sortFinestra });

      const limit = jest.fn();
      const sortFallback = jest.fn().mockReturnValue({ limit });
      model.find.mockReturnValueOnce({ sort: sortFallback });

      await service.findProssimi(3);

      expect(model.find).toHaveBeenCalledTimes(2);
      const fallbackFilter = model.find.mock.calls[1][0];
      expect(fallbackFilter.pubblicato).toBe(true);
      expect(fallbackFilter.dataInizio).toBeUndefined();
      expect(sortFallback).toHaveBeenCalledWith({ dataInizio: 1 });
      expect(limit).toHaveBeenCalledWith(3);
    });

    it('defaults the limit to 5', async () => {
      const sortFinestra = jest.fn().mockResolvedValue([]);
      model.find.mockReturnValueOnce({ sort: sortFinestra });
      const limit = jest.fn();
      model.find.mockReturnValueOnce({ sort: jest.fn().mockReturnValue({ limit }) });

      await service.findProssimi();

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
