import { Injectable } from '@nestjs/common';
import {
  CreateMessageDto,
  CreateNotificationDto,
  CreateQuestionAnswerDto,
  CreateRatingDto,
  CreateSupportTicketDto,
} from './dto/create-interaction.dto';

@Injectable()
export class InteractionsService {
  createMessage(createMessageDto: CreateMessageDto): string {
    console.log(createMessageDto);
    return 'Message sent';
  }

  createRating(createRatingDto: CreateRatingDto): string {
    console.log(createRatingDto);
    return 'Rating submitted';
  }

  createNotification(createNotificationDto: CreateNotificationDto): string {
    console.log(createNotificationDto);
    return 'Notification created';
  }

  createSupportTicket(createSupportTicketDto: CreateSupportTicketDto): string {
    console.log(createSupportTicketDto);
    return 'Ticket submitted';
  }

  createQA(createQuestionAnswerDto: CreateQuestionAnswerDto): string {
    console.log(createQuestionAnswerDto);
    return 'QA added';
  }

  findAll(): string {
    return 'All interactions';
  }
}
