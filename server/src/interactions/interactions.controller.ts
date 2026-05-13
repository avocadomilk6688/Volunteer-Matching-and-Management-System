import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { QuestionAnswer } from './entities/question_answer.entity';
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

  // Fetch all QAs - Path: GET /interactions/qa
  @Get('qa')
  async findAllQA(): Promise<QuestionAnswer[]> {
    return await this.interactionsService.findAllQA();
  }

  @Post('qa')
  createQA(@Body() createQuestionAnswerDto: CreateQuestionAnswerDto) {
    return this.interactionsService.createQA(createQuestionAnswerDto);
  }

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

  @Get()
  findAll() {
    return this.interactionsService.findAll();
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return await this.interactionsService.findAllByUserId(userId);
  }
}
