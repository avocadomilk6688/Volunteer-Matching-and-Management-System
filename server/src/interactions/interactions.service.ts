import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import { Message } from './entities/message.entity';
import { Notification } from './entities/notification.entity';
import { QuestionAnswer } from './entities/question_answer.entity';
import { Rating } from './entities/rating.entity';
import { SupportTicket } from './entities/support_ticket.entity';

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
  ) {}

  async createMessage(dto: CreateMessageDto): Promise<string> {
    const id = await generateCustomId(this.messageRepo, 'M');
    const newMessage = this.messageRepo.create({ id, ...dto });
    await this.messageRepo.save(newMessage);
    return `Message ${id} sent successfully`;
  }

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

  async createQA(dto: CreateQuestionAnswerDto): Promise<string> {
    const id = await generateCustomId(this.qaRepo, 'QA');
    const newQA = this.qaRepo.create({ id, ...dto });
    await this.qaRepo.save(newQA);
    return `QA ${id} added`;
  }

  async findAll(): Promise<any[]> {
    // This is just a placeholder; you might want to fetch all messages or tickets specifically later
    return await this.messageRepo.find();
  }
}
