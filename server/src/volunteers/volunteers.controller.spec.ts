import { Test, TestingModule } from '@nestjs/testing';
import { VolunteersController } from './volunteers.controller';
import { VolunteersService } from './volunteers.service';

describe('VolunteersController', () => {
  let controller: VolunteersController;

  const mockVolunteersService = {
    getLeaderboard: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    completeProgramme: jest.fn(),
    getHistory: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VolunteersController],
      providers: [
        {
          provide: VolunteersService,
          useValue: mockVolunteersService,
        },
      ],
    }).compile();

    controller = module.get<VolunteersController>(VolunteersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
