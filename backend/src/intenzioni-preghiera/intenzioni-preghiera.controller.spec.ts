import { Test } from '@nestjs/testing';
import { IntenzioniPreghieraController } from './intenzioni-preghiera.controller';
import { IntenzioniPreghieraService } from './intenzioni-preghiera.service';

describe('IntenzioniPreghieraController', () => {
  let controller: IntenzioniPreghieraController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [IntenzioniPreghieraController],
      providers: [{ provide: IntenzioniPreghieraService, useValue: service }],
    }).compile();
    controller = moduleRef.get(IntenzioniPreghieraController);
  });

  it('create delegates the public dto to the service', () => {
    const dto = { testo: 'Una preghiera' } as any;
    controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll delegates to the service', () => {
    controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('update delegates id and dto to the service', () => {
    const dto = { letta: true } as any;
    controller.update('abc', dto);
    expect(service.update).toHaveBeenCalledWith('abc', dto);
  });

  it('remove delegates to the service', () => {
    controller.remove('abc');
    expect(service.remove).toHaveBeenCalledWith('abc');
  });
});
