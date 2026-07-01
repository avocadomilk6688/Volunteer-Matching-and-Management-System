import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';

// Entities
import { Message } from './entities/message.entity';
import { Notification } from './entities/notification.entity';
import { QuestionAnswer } from './entities/question_answer.entity';
import { Rating } from './entities/rating.entity';
import { SupportTicket } from './entities/support_ticket.entity';
import { Application } from '../applications/entities/application.entity';
import { User } from '../users/entities/user.entity';
import { Programme } from '../programmes/entities/programme.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { VolunteersService } from '../volunteers/volunteers.service';

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
  hasUnread: boolean;
}

interface RawProgrammeLookupRow {
  organizationId: string | null;
}

interface RawAggregateScoreRow {
  meanScore: string | null;
}

interface RawActiveProgrammeRow {
  id: string;
  title: string;
}

interface MinimalChatGateway {
  server: {
    to: (roomName: string) => {
      emit: (eventName: string, data: Message) => void;
    };
  };
}

@Injectable()
export class InteractionsService {
  public chatGateway: MinimalChatGateway | null = null;

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

    @InjectRepository(Volunteer)
    private readonly volunteerRepo: Repository<Volunteer>,

    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,

    private readonly volunteersService: VolunteersService,
  ) {}

  // --- Q&A Logic ---
  async findAllQA(): Promise<QuestionAnswer[]> {
    return await this.qaRepo.find({
      order: { id: 'ASC' },
    });
  }

  async createQA(createQaDto: CreateQuestionAnswerDto): Promise<string> {
    const id = await generateCustomId(this.qaRepo, 'QA');
    const newQA = this.qaRepo.create({ id, ...createQaDto });
    await this.qaRepo.save(newQA);
    return `QA ${id} added`;
  }

  async updateQA(
    id: string,
    updateQaDto: Partial<CreateQuestionAnswerDto>,
  ): Promise<QuestionAnswer> {
    const existingQA = await this.qaRepo.findOne({ where: { id } });
    if (!existingQA) {
      throw new NotFoundException(
        `Q&A record with item identifier ID "${id}" does not exist inside the server primary registry.`,
      );
    }

    const updatedQA = this.qaRepo.merge(existingQA, updateQaDto);
    return await this.qaRepo.save(updatedQA);
  }

  async removeQA(id: string): Promise<{ deleted: boolean; message: string }> {
    const existingQA = await this.qaRepo.findOne({ where: { id } });
    if (!existingQA) {
      throw new NotFoundException(
        `Q&A record with item identifier ID "${id}" does not exist inside the server primary registry.`,
      );
    }

    await this.qaRepo.delete(id);
    return {
      deleted: true,
      message: `FAQ entity row matching key "${id}" dropped successfully.`,
    };
  }

  // --- Messaging Logic ---
  async createMessage(
    createMessageDto: CreateMessageDto & { programmeId?: string },
  ): Promise<Message> {
    const id = await generateCustomId(this.messageRepo, 'M');

    const newMessage = this.messageRepo.create({
      id,
      content: createMessageDto.content,
      sender: { id: createMessageDto.senderId } as User,
      receiver: { id: createMessageDto.receiverId } as User,
      programme: createMessageDto.programmeId
        ? ({ id: createMessageDto.programmeId } as Programme)
        : undefined,
      isRead: false,
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
    const contactsMap = new Map<string, RecentContact>();

    const org = await this.organizationRepo.findOne({
      where: { user: { id: userId } },
    });
    if (org) {
      const activeProgrammes = await this.applicationRepo.manager.query<
        RawActiveProgrammeRow[]
      >(
        `SELECT p.id, p.title 
         FROM programme p 
         WHERE p.organizationId = ?`,
        [org.id],
      );

      for (const prog of activeProgrammes) {
        const uniqueThreadKey = `BROADCAST_${prog.id}`;
        contactsMap.set(uniqueThreadKey, {
          partnerId: 'BATCH',
          username: `📢 Broadcast: ${prog.title}`,
          profilePic: null,
          lastMessage: 'Click here to broadcast to all participants.',
          timestamp: new Date(),
          role: 'programme_broadcast',
          programmeId: prog.id,
          programmeName: prog.title,
          hasUnread: false,
        });
      }
    }

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
          hasUnread: msg.receiver.id === userId && !msg.isRead,
        });
      }
    }

    const contacts = Array.from(contactsMap.values());
    const hasUnreadMessages = contacts.some(
      (contact) => contact.hasUnread && contact.role !== 'programme_broadcast',
    );

    return contacts.sort((a, b) => {
      const aBroadcast = a.role === 'programme_broadcast';
      const bBroadcast = b.role === 'programme_broadcast';

      if (hasUnreadMessages) {
        if (a.hasUnread !== b.hasUnread) return a.hasUnread ? -1 : 1;
        if (aBroadcast !== bBroadcast) return aBroadcast ? 1 : -1;
      } else if (aBroadcast !== bBroadcast) {
        return aBroadcast ? -1 : 1;
      }

      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  // ─── 🌟 ADDED: CHAT MESSAGE UNREAD COUNTER FROM DETAILED REPO CORES ───
  async getUnreadMessagesCount(userId: string): Promise<{ count: number }> {
    const count = await this.messageRepo.count({
      where: {
        receiver: { id: userId },
        isRead: false,
      },
    });
    return { count };
  }

  // ─── 🌟 ADDED: FLIP UNREAD FIELD MATRICES FOR GIVEN TARGET USER ID ───
  async markMessagesAsRead(
    userId: string,
  ): Promise<{ success: boolean; updatedCount: number }> {
    const targetMessages = await this.messageRepo.find({
      where: {
        receiver: { id: userId },
        isRead: false,
      },
    });

    if (targetMessages.length > 0) {
      targetMessages.forEach((msg) => {
        msg.isRead = true;
      });
      await this.messageRepo.save(targetMessages);
    }

    return { success: true, updatedCount: targetMessages.length };
  }

  // --- Broadcast Logic ---
  async broadcastToProgramme(
    programmeId: string,
    senderId: string,
    content: string,
  ) {
    const applications = await this.applicationRepo.find({
      where: {
        programme: { id: programmeId },
        status: In(['upcoming', 'Upcoming']),
      },
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

  /**
   * Distributes a single broadcast text down to all upcoming/completed program attendants,
   * saves records cleanly to history, and emits signals to each volunteer's socket.
   */
  async sendBatchMessage(dto: {
    senderId: string;
    programmeId: string;
    content: string;
  }) {
    console.log('[BATCH BROADCAST TRIGGERED]:', dto);

    const applications = await this.applicationRepo.find({
      where: {
        programme: { id: dto.programmeId },
        status: In(['upcoming', 'completed', 'Upcoming', 'Completed']),
      },
      relations: ['volunteer', 'volunteer.user'],
    });

    console.log(
      `[BATCH BROADCAST]: Found ${applications.length} target matching attendants.`,
    );

    if (applications.length === 0) {
      return {
        success: false,
        processedCount: 0,
        notice:
          'No upcoming or completed volunteers found inside this programme thread.',
      };
    }

    const formulationBody = `[Batch Message] ${dto.content}`;
    const generatedSavedRows: Message[] = [];

    for (const app of applications) {
      const targetUserId = app.volunteer?.user?.id;
      if (!targetUserId) continue;

      const customId = await generateCustomId(this.messageRepo, 'M');

      const msgRow = this.messageRepo.create({
        id: customId,
        content: formulationBody,
        sender: { id: dto.senderId } as User,
        receiver: { id: targetUserId } as User,
        programme: { id: dto.programmeId } as Programme,
        timestamp: new Date(),
      });

      const savedEntry = await this.messageRepo.save(msgRow);
      generatedSavedRows.push(savedEntry);

      if (this.chatGateway) {
        this.chatGateway.server
          .to(`room_${targetUserId}`)
          .emit('receive_message', savedEntry);
      }
    }

    return { success: true, processedCount: generatedSavedRows.length };
  }

  // --- Rating Logic ---

  /**
   * Processes a single incoming rating record, auto-calculates timeline durations,
   * updates application tracking states to 'Completed', and increments volunteer points.
   */
  async createRating(
    createRatingDto: CreateRatingDto & {
      programmeId: string;
      rating: number;
      senderRole?: string;
      senderId?: string;
      targetId?: string;
      targetVolunteerId?: string;
    },
  ): Promise<string> {
    const id = await generateCustomId(this.ratingRepo, 'R');

    const finalRateeId =
      createRatingDto.targetId || createRatingDto.targetVolunteerId;

    const newRating = this.ratingRepo.create({
      id,
      value: createRatingDto.rating,
      rater: createRatingDto.senderId
        ? ({ id: createRatingDto.senderId } as User)
        : undefined,
      ratee: finalRateeId ? ({ id: finalRateeId } as User) : undefined,
      programme: createRatingDto.programmeId
        ? ({ id: createRatingDto.programmeId } as Programme)
        : undefined,
    });

    await this.ratingRepo.save(newRating);

    if (
      createRatingDto.senderRole === 'volunteer' &&
      createRatingDto.senderId
    ) {
      const appRecord = await this.applicationRepo
        .createQueryBuilder('app')
        .leftJoinAndSelect('app.programme', 'programme')
        .leftJoinAndSelect('programme.schedule', 'schedule')
        .where('app.volunteerId = :vId', { vId: createRatingDto.senderId })
        .andWhere('app.programmeId = :pId', {
          pId: createRatingDto.programmeId,
        })
        .getOne();

      if (appRecord && appRecord.programme?.schedule) {
        const start = new Date(
          appRecord.programme.schedule.start_time,
        ).getTime();
        const end = new Date(appRecord.programme.schedule.end_time).getTime();

        const creditHours = Math.max(
          0,
          Math.round((end - start) / (1000 * 60 * 60)),
        );

        await this.volunteerRepo
          .createQueryBuilder()
          .update(Volunteer)
          .set({ points: () => `points + ${creditHours}` })
          .where('id = :id', { id: createRatingDto.senderId })
          .execute();

        await this.applicationRepo.update(appRecord.id, {
          status: 'Completed',
          isRatedByVolunteer: true,
        });

        try {
          await this.volunteersService.completeProgramme(appRecord.id);
        } catch (err) {
          console.error('[LEADERBOARD POINT CALCULATION ERROR]:', err);
        }
      }
    }

    await this.recalculateTargetMean(
      createRatingDto.programmeId,
      createRatingDto.senderRole || '',
      finalRateeId || null,
    );

    return `Rating ${id} submitted successfully`;
  }

  /**
   * Processes a structured array of ratings sent from organizational batch panels.
   */
  async createBatchRatings(payload: {
    ratings: Array<
      CreateRatingDto & {
        programmeId: string;
        rating: number;
        senderRole: string;
        senderId: string;
        targetVolunteerId: string;
      }
    >;
  }): Promise<string> {
    if (!payload.ratings || payload.ratings.length === 0) {
      throw new BadRequestException(
        'Cannot execute empty batch updates matrix.',
      );
    }

    for (const rateItem of payload.ratings) {
      const id = await generateCustomId(this.ratingRepo, 'R');

      const newRating = this.ratingRepo.create({
        id,
        value: rateItem.rating,
        rater: { id: rateItem.senderId } as User,
        ratee: { id: rateItem.targetVolunteerId } as User,
        programme: { id: rateItem.programmeId } as Programme,
      });
      await this.ratingRepo.save(newRating);

      await this.recalculateTargetMean(
        rateItem.programmeId,
        rateItem.senderRole,
        rateItem.targetVolunteerId,
      );
    }

    return `Batch total of ${payload.ratings.length} reviews compiled successfully`;
  }

  /**
   * Internal algorithm to aggregate historical scores and update the profile table fields.
   */
  private async recalculateTargetMean(
    programmeId: string,
    senderRole: string,
    targetVolunteerId: string | null,
  ): Promise<void> {
    try {
      if (senderRole === 'volunteer') {
        const progLookup: RawProgrammeLookupRow[] =
          await this.ratingRepo.manager.query(
            `SELECT organizationId FROM programme WHERE id = ? LIMIT 1`,
            [programmeId],
          );

        if (progLookup.length === 0) return;
        const targetOrgId = progLookup[0].organizationId;
        if (!targetOrgId) return;

        const stats: RawAggregateScoreRow[] =
          await this.ratingRepo.manager.query(
            `SELECT AVG(value) as meanScore 
             FROM rating r
             WHERE r.rateeId = (
               SELECT userId FROM organization WHERE id = ? LIMIT 1
             )`,
            [targetOrgId],
          );

        const calculatedMean = stats[0]?.meanScore
          ? parseFloat(stats[0].meanScore)
          : 4.0;
        await this.organizationRepo.update(targetOrgId, {
          rating: calculatedMean,
        });
      } else if (senderRole === 'organization' && targetVolunteerId) {
        const stats: RawAggregateScoreRow[] =
          await this.ratingRepo.manager.query(
            `SELECT AVG(value) as meanScore 
             FROM rating 
             WHERE rateeId = ?`,
            [targetVolunteerId],
          );

        const calculatedMean = stats[0]?.meanScore
          ? parseFloat(stats[0].meanScore)
          : 4.0;
        await this.volunteerRepo.update(targetVolunteerId, {
          rating: calculatedMean,
        });
      }
    } catch (err) {
      console.error('[CRITICAL MEAN AGGREGATION CALCULATION FAILED]:', err);
    }
  }

  // --- General Interactions & Relational Notification Logic ---
  async createNotification(
    createNotificationDto: CreateNotificationDto & {
      type?: string;
      receiverId?: string;
    },
  ): Promise<string | { success: boolean; message: string }> {
    let cleanedContent = createNotificationDto.content;
    if (cleanedContent && cleanedContent.startsWith('NNaN')) {
      cleanedContent = cleanedContent.replace(/^NNaN/, '');
    }

    if (
      createNotificationDto.type === 'programme_report' ||
      !createNotificationDto.receiverId
    ) {
      const administrators = await this.userRepo.find({
        where: { role: 'admin' },
      });

      if (administrators.length === 0) {
        console.warn(
          'Broadcast canceled: No admin rows detected in user repository.',
        );
        return { success: false, message: 'No administrative accounts found.' };
      }

      for (const admin of administrators) {
        const customId = await generateCustomId(this.notificationRepo, 'NOT');

        const notif = this.notificationRepo.create({
          id: customId,
          content: cleanedContent,
          receiver: admin,
        });
        notif.createdAt = new Date();

        await this.notificationRepo.save(notif);
      }

      return `Notification broadcasted to ${administrators.length} administrators successfully`;
    }

    const singleCustomId = await generateCustomId(this.notificationRepo, 'NOT');

    const targetUser = await this.userRepo.findOne({
      where: { id: createNotificationDto.receiverId },
    });
    if (!targetUser) {
      throw new NotFoundException(
        `Notification target user with ID ${createNotificationDto.receiverId} not found`,
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

  // --- Support Ticket Pipeline ---
  async createSupportTicket(
    createTicketDto: CreateSupportTicketDto,
  ): Promise<string> {
    if (!createTicketDto.userId) {
      throw new BadRequestException(
        'Cannot log a support ticket without an active user ID context.',
      );
    }

    const id = await generateCustomId(this.ticketRepo, 'T');

    const userEntity = await this.userRepo.findOne({
      where: { id: createTicketDto.userId },
    });

    if (!userEntity) {
      throw new NotFoundException(
        `Relational linkage failed: User record with ID "${createTicketDto.userId}" not found in the primary registry.`,
      );
    }

    const newTicket = this.ticketRepo.create({
      id,
      content: createTicketDto.content,
      status: createTicketDto.status || 'open',
      user: userEntity,
    });

    await this.ticketRepo.save(newTicket);
    return `Ticket ${id} submitted`;
  }

  async findAllTickets(): Promise<SupportTicket[]> {
    return await this.ticketRepo.find({
      relations: ['user'],
      order: { id: 'DESC' },
    });
  }

  async updateSupportTicket(
    id: string,
    updateTicketDto: { status: string },
  ): Promise<SupportTicket> {
    const existingTicket = await this.ticketRepo.findOne({ where: { id } });
    if (!existingTicket) {
      throw new NotFoundException(
        `Support ticket with identifier code ID "${id}" does not exist inside the active table dataset.`,
      );
    }

    const updatedTicket = this.ticketRepo.merge(
      existingTicket,
      updateTicketDto,
    );
    return await this.ticketRepo.save(updatedTicket);
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
