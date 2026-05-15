import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import { Message } from './entities/message.entity';
import { Notification } from './entities/notification.entity';
import { QuestionAnswer } from './entities/question_answer.entity';
import { Rating } from './entities/rating.entity';
import { SupportTicket } from './entities/support_ticket.entity';
import { Application } from '../applications/entities/application.entity';
import { User } from '../users/entities/user.entity';

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
  async createMessage(dto: CreateMessageDto): Promise<Message> {
    const id = await generateCustomId(this.messageRepo, 'M');
    const newMessage = this.messageRepo.create({
      id,
      content: dto.content,
      sender: { id: dto.senderId } as User,
      receiver: { id: dto.receiverId } as User,
    });
    return await this.messageRepo.save(newMessage);
  }

  /**
   * Fetches full history with deep relations to get profile pictures for chat bubbles.
   */
  async getConversationHistory(
    user1: string,
    user2: string,
  ): Promise<Message[]> {
    return await this.messageRepo.find({
      where: [
        { sender: { id: user1 }, receiver: { id: user2 } },
        { sender: { id: user2 }, receiver: { id: user1 } },
      ],
      order: { timestamp: 'ASC' },
      relations: [
        'sender',
        'sender.volunteer',
        'sender.organization',
        'receiver',
        'receiver.volunteer',
        'receiver.organization',
      ],
    });
  }

  /**
   * Strictly typed recent contacts fetcher for the Sidebar.
   * Resolves the profile picture by checking user roles and associated tables.
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
      ],
    });

    const contactsMap = new Map<string, RecentContact>();

    for (const msg of messages) {
      const partner = msg.sender.id === userId ? msg.receiver : msg.sender;

      if (!contactsMap.has(partner.id)) {
        let profilePic: string | null = null;

        // Drill down into sub-tables based on role
        if (partner.role === 'volunteer') {
          profilePic = partner.volunteer?.profile_picture_url ?? null;
        } else if (partner.role === 'organization') {
          profilePic = partner.organization?.profile_picture_url ?? null;
        }

        contactsMap.set(partner.id, {
          partnerId: partner.id,
          username: partner.username,
          profilePic: profilePic,
          lastMessage: msg.content,
          timestamp: msg.timestamp,
          role: partner.role,
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
      relations: ['sender', 'receiver'],
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
