import { Test } from '@nestjs/testing';
import { EventiController } from './eventi.controller';
import { EventiService } from './eventi.service';

describe('EventiController', () => {
  let controller: EventiController;
  const service = {
    findAll: jest.fn(),
    findProssimi: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [EventiController],
      providers: [{ provide: EventiService, useValue: service }],
    }).compile();
    controller = moduleRef.get(EventiController);
  });

  describe('findAll', () => {
    it('requests only published events by default (tutti undefined)', () => {
      controller.findAll(undefined);
      expect(service.findAll).toHaveBeenCalledWith(true);
    });

    it('requests all events when tutti=true', () => {
      controller.findAll('true');
      expect(service.findAll).toHaveBeenCalledWith(false);
    });
  });

  describe('findProssimi', () => {
    it('parses the limit query into a number', () => {
      controller.findProssimi('3');
      expect(service.findProssimi).toHaveBeenCalledWith(3);
    });

    it('defaults to 5 when limit is absent', () => {
      controller.findProssimi(undefined);
      expect(service.findProssimi).toHaveBeenCalledWith(5);
    });
  });

  it('findOne delegates to the service', () => {
    controller.findOne('abc');
    expect(service.findOne).toHaveBeenCalledWith('abc');
  });

  it('create delegates the dto to the service', () => {
    const dto = { titolo: 'T', dataInizio: new Date() } as any;
    controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
