import { Test, TestingModule } from '@nestjs/testing';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';

describe('InteractionsController', () => {
  let controller: InteractionsController;

  const mockInteractionsService = {
    findAllQA: jest.fn(),
    createQA: jest.fn(),
    updateQA: jest.fn(),
    removeQA: jest.fn(),
    getConversationHistory: jest.fn(),
    getRecentContacts: jest.fn(),
    getUnreadMessagesCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InteractionsController],
      providers: [
        {
          provide: InteractionsService,
          useValue: mockInteractionsService,
        },
      ],
    }).compile();

    controller = module.get<InteractionsController>(InteractionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
