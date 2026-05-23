import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

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

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

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
  async createMessage(
    dto: CreateMessageDto & { programmeId?: string },
  ): Promise<Message> {
    const id = await generateCustomId(this.messageRepo, 'M');

    const newMessage = this.messageRepo.create({
      id,
      content: dto.content,
      sender: { id: dto.senderId } as User,
      receiver: { id: dto.receiverId } as User,
      programme: dto.programmeId
        ? ({ id: dto.programmeId } as Programme)
        : undefined,
    });

    return await this.messageRepo.save(newMessage);
  }

  async getConversationHistory(
    user1: string,
    user2: string,
    programmeId?: string,
  ): Promise<Message[]> {
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

  // --- General Interactions & Relational Notification Logic ---
  async createRating(dto: CreateRatingDto): Promise<string> {
    const id = await generateCustomId(this.ratingRepo, 'R');
    const newRating = this.ratingRepo.create({ id, ...dto });
    await this.ratingRepo.save(newRating);
    return `Rating ${id} submitted successfully`;
  }

  /**
   * Safe Notification dispatch handler tailored to your specific User relational entity setup.
   * Cleans string artifacts and saves entities sequentially to fully eliminate key assignment race conditions.
   */
  async createNotification(
    dto: CreateNotificationDto & { type?: string; receiverId?: string },
  ): Promise<any> {
    // 1. Sanitize 'NNaN' text anomalies sent over from frontend mutations
    let cleanedContent = dto.content;
    if (cleanedContent && cleanedContent.startsWith('NNaN')) {
      cleanedContent = cleanedContent.replace(/^NNaN/, '');
    }

    // 2. Multi-Admin Broadcast Logic path
    if (dto.type === 'programme_report' || !dto.receiverId) {
      const administrators = await this.userRepo.find({
        where: { role: 'admin' },
      });

      if (administrators.length === 0) {
        console.warn(
          'Broadcast canceled: No admin rows detected in user repository.',
        );
        return { success: false, message: 'No administrative accounts found.' };
      }

      // --- FIXED: Process admin rows in sequence to stop generateCustomId overlapping duplicates ---
      for (const admin of administrators) {
        const customId = await generateCustomId(this.notificationRepo, 'NOT');

        const notif = this.notificationRepo.create({
          id: customId,
          content: cleanedContent,
          receiver: admin,
        });
        notif.createdAt = new Date();

        // Must await save directly within iteration loop to lock ID state before creating the next row
        await this.notificationRepo.save(notif);
      }

      return `Notification broadcasted to ${administrators.length} administrators successfully`;
    }

    // 3. Fallback path for normal single target row notifications
    const singleCustomId = await generateCustomId(this.notificationRepo, 'NOT');

    const targetUser = await this.userRepo.findOne({
      where: { id: dto.receiverId },
    });
    if (!targetUser) {
      throw new NotFoundException(
        `Notification target user with ID ${dto.receiverId} not found`,
      );
    }

    const standaloneNotification = this.notificationRepo.create({
      id: singleCustomId,
      content: cleanedContent,
      receiver: targetUser,
    });
    standaloneNotification.createdAt = new Date();

    await this.notificationRepo.save(standaloneNotification);
    return `Notification ${singleCustomId} created`;
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
