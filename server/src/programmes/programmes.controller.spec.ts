import { Test, TestingModule } from '@nestjs/testing';
import { ProgrammesController } from './programmes.controller';
import { ProgrammesService } from './programmes.service';

describe('ProgrammesController', () => {
  let controller: ProgrammesController;

  const mockProgrammesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllAdmin: jest.fn(),
    getRecommended: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgrammesController],
      providers: [
        {
          provide: ProgrammesService,
          useValue: mockProgrammesService,
        },
      ],
    }).compile();

    controller = module.get<ProgrammesController>(ProgrammesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
