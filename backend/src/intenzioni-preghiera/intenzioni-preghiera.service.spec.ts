import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { IntenzioniPreghieraService } from './intenzioni-preghiera.service';
import { IntenzionePreghiera } from './schemas/intenzione-preghiera.schema';

describe('IntenzioniPreghieraService', () => {
  let service: IntenzioniPreghieraService;
  const model = {
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        IntenzioniPreghieraService,
        { provide: getModelToken(IntenzionePreghiera.name), useValue: model },
      ],
    }).compile();
    service = moduleRef.get(IntenzioniPreghieraService);
  });

  it('create delegates the dto to the model', () => {
    const dto = { testo: 'Prega per me' };
    service.create(dto);
    expect(model.create).toHaveBeenCalledWith(dto);
  });

  it('findAll returns every intention newest first', () => {
    const sort = jest.fn();
    model.find.mockReturnValue({ sort });
    service.findAll();
    expect(model.find).toHaveBeenCalledWith();
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  describe('update', () => {
    it('throws NotFoundException when the id does not exist', async () => {
      model.findByIdAndUpdate.mockResolvedValue(null);
      await expect(service.update('x', { letta: true })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the id does not exist', async () => {
      model.findByIdAndDelete.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
