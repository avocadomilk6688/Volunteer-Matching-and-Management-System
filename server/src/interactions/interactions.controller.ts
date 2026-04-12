import { Controller, Get, Post, Body } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import {
  CreateMessageDto,
  CreateNotificationDto,
  CreateQuestionAnswerDto,
  CreateRatingDto,
  CreateSupportTicketDto,
} from './dto/create-interaction.dto';

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post('message')
  createMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.interactionsService.createMessage(createMessageDto);
  }

  @Post('rating')
  createRating(@Body() createRatingDto: CreateRatingDto) {
    return this.interactionsService.createRating(createRatingDto);
  }

  @Post('notification')
  createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.interactionsService.createNotification(createNotificationDto);
  }

  @Post('support-ticket')
  createSupportTicket(@Body() createSupportTicketDto: CreateSupportTicketDto) {
    return this.interactionsService.createSupportTicket(createSupportTicketDto);
  }

  @Post('qa')
  createQA(@Body() createQuestionAnswerDto: CreateQuestionAnswerDto) {
    return this.interactionsService.createQA(createQuestionAnswerDto);
  }

  @Get()
  findAll() {
    return this.interactionsService.findAll();
  }
}
