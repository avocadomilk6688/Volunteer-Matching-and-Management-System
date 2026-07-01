import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { Message } from './entities/message.entity';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { QuestionAnswer } from './entities/question_answer.entity';
import { Rating } from './entities/rating.entity';
import { SupportTicket } from './entities/support_ticket.entity';
import { Application } from '../applications/entities/application.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { VolunteersService } from '../volunteers/volunteers.service';
import { generateCustomId } from '../common/utils/id_generator.util';

jest.mock('../common/utils/id_generator.util');

describe('InteractionsService', () => {
  let service: InteractionsService;
  let messageRepo: Repository<Message>;
  let qaRepo: Repository<QuestionAnswer>;
  let applicationRepo: Repository<Application>;
  let organizationRepo: Repository<Organization>;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve(x)),
    count: jest.fn(),
    delete: jest.fn(),
    merge: jest.fn((orig, src) => ({ ...orig, ...src })),
    manager: {
      query: jest.fn(),
    },
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InteractionsService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(QuestionAnswer),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Rating),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(SupportTicket),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Application),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Volunteer),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: mockRepository(),
        },
        {
          provide: VolunteersService,
          useValue: {
            completeProgramme: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InteractionsService>(InteractionsService);
    messageRepo = module.get<Repository<Message>>(getRepositoryToken(Message));
    qaRepo = module.get<Repository<QuestionAnswer>>(
      getRepositoryToken(QuestionAnswer),
    );
    applicationRepo = module.get<Repository<Application>>(
      getRepositoryToken(Application),
    );
    organizationRepo = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('FAQ / Q&A Logic', () => {
    it('should find all Q&A records sorted by id', async () => {
      const mockQAs = [
        { id: 'QA001', question: 'Q1' },
        { id: 'QA002', question: 'Q2' },
      ];
      (qaRepo.find as jest.Mock).mockResolvedValue(mockQAs);

      const result = await service.findAllQA();

      expect(result).toEqual(mockQAs);
      expect(qaRepo.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
    });

    it('should create and save a new Q&A record', async () => {
      (generateCustomId as jest.Mock).mockResolvedValue('QA001');
      const dto = { question: 'What is this?', answer: 'A volunteer app.' };
      const expectedMsg = 'QA QA001 added';

      const result = await service.createQA(dto);

      expect(result).toBe(expectedMsg);
      expect(qaRepo.create).toHaveBeenCalledWith({ id: 'QA001', ...dto });
      expect(qaRepo.save).toHaveBeenCalled();
    });

    it('should update an existing Q&A record', async () => {
      const existingQA = { id: 'QA001', question: 'Old Q', answer: 'Old A' };
      (qaRepo.findOne as jest.Mock).mockResolvedValue(existingQA);
      (qaRepo.save as jest.Mock).mockResolvedValue({
        ...existingQA,
        question: 'New Q',
      });

      const result = await service.updateQA('QA001', { question: 'New Q' });

      expect(result.question).toBe('New Q');
      expect(qaRepo.findOne).toHaveBeenCalledWith({ where: { id: 'QA001' } });
      expect(qaRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException on update if QA not found', async () => {
      (qaRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.updateQA('QA999', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should remove a Q&A record successfully', async () => {
      (qaRepo.findOne as jest.Mock).mockResolvedValue({ id: 'QA001' });

      const result = await service.removeQA('QA001');

      expect(result).toEqual({
        deleted: true,
        message: 'FAQ entity row matching key "QA001" dropped successfully.',
      });
      expect(qaRepo.delete).toHaveBeenCalledWith('QA001');
    });
  });

  describe('Messaging Logic', () => {
    it('should create and save a message', async () => {
      (generateCustomId as jest.Mock).mockResolvedValue('M001');
      const dto = {
        senderId: 'U001',
        receiverId: 'U002',
        content: 'Hello World',
        programmeId: 'P001',
      };

      const result = await service.createMessage(dto);

      expect(result).toBeDefined();
      expect(messageRepo.create).toHaveBeenCalledWith({
        id: 'M001',
        content: 'Hello World',
        sender: { id: 'U001' },
        receiver: { id: 'U002' },
        programme: { id: 'P001' },
        isRead: false,
      });
      expect(messageRepo.save).toHaveBeenCalled();
    });

    it('should retrieve conversation history between two users', async () => {
      const mockHistory = [
        {
          id: 'M001',
          content: 'Hey',
          sender: { id: 'U001' },
          receiver: { id: 'U002' },
        },
      ];
      (messageRepo.find as jest.Mock).mockResolvedValue(mockHistory);

      const result = await service.getConversationHistory(
        'U001',
        'U002',
        'P001',
      );

      expect(result).toEqual(mockHistory);
      expect(messageRepo.find).toHaveBeenCalledWith({
        where: [
          {
            sender: { id: 'U001' },
            receiver: { id: 'U002' },
            programme: { id: 'P001' },
          },
          {
            sender: { id: 'U002' },
            receiver: { id: 'U001' },
            programme: { id: 'P001' },
          },
        ],
        order: { timestamp: 'ASC' },
        relations: expect.any(Array),
      });
    });

    it('should fetch unread messages count', async () => {
      (messageRepo.count as jest.Mock).mockResolvedValue(5);

      const result = await service.getUnreadMessagesCount('U001');

      expect(result).toEqual({ count: 5 });
      expect(messageRepo.count).toHaveBeenCalledWith({
        where: { receiver: { id: 'U001' }, isRead: false },
      });
    });

    it('should fetch recent contacts and format correctly', async () => {
      // User is an organization, mock organization lookup and active programs for broadcasts
      (organizationRepo.findOne as jest.Mock).mockResolvedValue({ id: 'O001' });
      (applicationRepo.manager.query as jest.Mock).mockResolvedValueOnce([
        { id: 'P001', title: 'Eco Guardians' },
      ]);

      const mockMessages = [
        {
          id: 'M002',
          content: 'Got it!',
          timestamp: new Date('2026-06-15T12:00:00Z'),
          isRead: true,
          sender: {
            id: 'U002',
            role: 'volunteer',
            username: 'volunteer1',
            volunteer: { profile_picture_url: '/pic.jpg' },
          },
          receiver: { id: 'U001' },
          programme: { id: 'P001', title: 'Eco Guardians' },
        },
      ];
      (messageRepo.find as jest.Mock).mockResolvedValue(mockMessages);

      const result = await service.getRecentContacts('U001');

      expect(result.length).toBeGreaterThan(0);
      // First is the broadcast contact
      expect(result[0].partnerId).toBe('BATCH');
      // Second is the active DM thread partner
      expect(result[1].partnerId).toBe('U002');
      expect(result[1].username).toBe('volunteer1');
      expect(result[1].profilePic).toBe('/pic.jpg');
    });
  });

  describe('Broadcast Logic', () => {
    it('should broadcast message to all upcoming participants', async () => {
      (generateCustomId as jest.Mock).mockResolvedValue('M002');
      const mockApplications = [
        { volunteer: { user: { id: 'U002' } } },
        { volunteer: { user: { id: 'U003' } } },
      ];
      (applicationRepo.find as jest.Mock).mockResolvedValue(mockApplications);

      const result = await service.broadcastToProgramme(
        'P001',
        'U001',
        'Alert: Starting in 10 mins!',
      );

      expect(result.participantUserIds).toEqual(['U002', 'U003']);
      expect(result.messages.length).toBe(2);
      expect(applicationRepo.find).toHaveBeenCalledWith({
        where: {
          programme: { id: 'P001' },
          status: In(['upcoming', 'Upcoming']),
        },
        relations: ['volunteer', 'volunteer.user'],
      });
      expect(messageRepo.save).toHaveBeenCalledWith(result.messages);
    });
  });
});
