import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm'; // FIX: Imported IsNull to handle strict separation

// Entities
import { Message } from './entities/message.entity';
import { Notification } from './entities/notification.entity';
import { QuestionAnswer } from './entities/question_answer.entity';
import { Rating } from './entities/rating.entity';
import { SupportTicket } from './entities/support_ticket.entity';
import { Application } from '../applications/entities/application.entity';
import { User } from '../users/entities/user.entity';
import { Programme } from '../programmes/entities/programme.entity';

// DTOs
import {
  CreateMessageDto,
  CreateNotificationDto,
  CreateQuestionAnswerDto,
  CreateRatingDto,
  CreateSupportTicketDto,
} from './dto/create-interaction.dto';

// Utils
import { generateCustomId } from '../common/utils/id_generator.util';

// --- Interface for Frontend Recent Contacts List ---
export interface RecentContact {
  partnerId: string;
  username: string;
  profilePic: string | null;
  lastMessage: string;
  timestamp: Date;
  role: string;
  programmeId: string | null;
  programmeName: string | null;
}

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,

    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,

    @InjectRepository(QuestionAnswer)
    private readonly qaRepo: Repository<QuestionAnswer>,

    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,

    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,

    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  // --- Q&A Logic ---
  async findAllQA(): Promise<QuestionAnswer[]> {
    return await this.qaRepo.find({
      order: { id: 'ASC' },
    });
  }

  async createQA(dto: CreateQuestionAnswerDto): Promise<string> {
    const id = await generateCustomId(this.qaRepo, 'QA');
    const newQA = this.qaRepo.create({ id, ...dto });
    await this.qaRepo.save(newQA);
    return `QA ${id} added`;
  }

  // --- Messaging Logic ---

  /**
   * Creates a single message.
   * Links to a programme if programmeId is provided in the request.
   */
  async createMessage(
    dto: CreateMessageDto & { programmeId?: string },
  ): Promise<Message> {
    const id = await generateCustomId(this.messageRepo, 'M');

    const newMessage = this.messageRepo.create({
      id,
      content: dto.content,
      sender: { id: dto.senderId } as User,
      receiver: { id: dto.receiverId } as User,
      // Map the programme if it exists, otherwise keep it undefined for DeepPartial compatibility
      programme: dto.programmeId
        ? ({ id: dto.programmeId } as Programme)
        : undefined,
    });

    return await this.messageRepo.save(newMessage);
  }

  /**
   * Fetches history filtered by both users AND the specific programme.
   * FIX: Uses IsNull() to cleanly isolate general conversations from project-bound threads.
   */
  async getConversationHistory(
    user1: string,
    user2: string,
    programmeId?: string,
  ): Promise<Message[]> {
    // If programmeId is missing or an empty string, explicitly check for IsNull()
    const programmeCondition = programmeId ? { id: programmeId } : IsNull();

    return await this.messageRepo.find({
      where: [
        {
          sender: { id: user1 },
          receiver: { id: user2 },
          programme: programmeCondition,
        },
        {
          sender: { id: user2 },
          receiver: { id: user1 },
          programme: programmeCondition,
        },
      ],
      order: { timestamp: 'ASC' },
      relations: [
        'sender',
        'sender.volunteer',
        'sender.organization',
        'receiver',
        'receiver.volunteer',
        'receiver.organization',
        'programme',
      ],
    });
  }

  /**
   * Fetches unique recent contacts grouped by Partner + Programme.
   * This allows separated chat threads for different programmes with the same org.
   */
  async getRecentContacts(userId: string): Promise<RecentContact[]> {
    const messages = await this.messageRepo.find({
      where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
      order: { timestamp: 'DESC' },
      relations: [
        'sender',
        'sender.volunteer',
        'sender.organization',
        'receiver',
        'receiver.volunteer',
        'receiver.organization',
        'programme',
      ],
    });

    const contactsMap = new Map<string, RecentContact>();

    for (const msg of messages) {
      const partner = msg.sender.id === userId ? msg.receiver : msg.sender;
      const progId = msg.programme?.id || 'general';

      const uniqueThreadKey = `${partner.id}_${progId}`;

      if (!contactsMap.has(uniqueThreadKey)) {
        let profilePic: string | null = null;

        if (partner.role === 'volunteer') {
          profilePic = partner.volunteer?.profile_picture_url ?? null;
        } else if (partner.role === 'organization') {
          profilePic = partner.organization?.profile_picture_url ?? null;
        }

        contactsMap.set(uniqueThreadKey, {
          partnerId: partner.id,
          username: partner.username,
          profilePic: profilePic,
          lastMessage: msg.content,
          timestamp: msg.timestamp,
          role: partner.role,
          programmeId: msg.programme?.id ?? null,
          programmeName: msg.programme?.title ?? 'General Inquiry',
        });
      }
    }

    return Array.from(contactsMap.values());
  }

  // --- Broadcast Logic ---
  async broadcastToProgramme(
    programmeId: string,
    senderId: string,
    content: string,
  ) {
    const applications = await this.applicationRepo.find({
      where: { programme: { id: programmeId }, status: 'approved' },
      relations: ['volunteer', 'volunteer.user'],
    });

    const participantUserIds = applications.map((app) => app.volunteer.user.id);

    const messages = await Promise.all(
      participantUserIds.map(async (receiverId) => {
        const id = await generateCustomId(this.messageRepo, 'M');
        return this.messageRepo.create({
          id,
          content,
          sender: { id: senderId } as User,
          receiver: { id: receiverId } as User,
          programme: { id: programmeId } as Programme,
        });
      }),
    );

    await this.messageRepo.save(messages);
    return { participantUserIds, messages };
  }

  // --- General Interactions ---
  async createRating(dto: CreateRatingDto): Promise<string> {
    const id = await generateCustomId(this.ratingRepo, 'R');
    const newRating = this.ratingRepo.create({ id, ...dto });
    await this.ratingRepo.save(newRating);
    return `Rating ${id} submitted successfully`;
  }

  async createNotification(dto: CreateNotificationDto): Promise<string> {
    const id = await generateCustomId(this.notificationRepo, 'N');
    const newNotification = this.notificationRepo.create({ id, ...dto });
    await this.notificationRepo.save(newNotification);
    return `Notification ${id} created`;
  }

  async createSupportTicket(dto: CreateSupportTicketDto): Promise<string> {
    const id = await generateCustomId(this.ticketRepo, 'T');
    const newTicket = this.ticketRepo.create({ id, ...dto });
    await this.ticketRepo.save(newTicket);
    return `Ticket ${id} submitted`;
  }

  async findAll(): Promise<Message[]> {
    return await this.messageRepo.find({
      relations: ['sender', 'receiver', 'programme'],
      order: { timestamp: 'ASC' },
    });
  }

  async findAllByUserId(userId: string): Promise<Notification[]> {
    return await this.notificationRepo.find({
      where: { receiver: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }
}
