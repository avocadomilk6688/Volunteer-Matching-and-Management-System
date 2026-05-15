import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InteractionsService, RecentContact } from './interactions.service';
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

  @Get('history/:user1/:user2')
  async getHistory(@Param('user1') u1: string, @Param('user2') u2: string) {
    return await this.interactionsService.getConversationHistory(u1, u2);
  }

  // Updated to include the explicit return type
  @Get('contacts/:userId')
  async getContacts(@Param('userId') userId: string): Promise<RecentContact[]> {
    return await this.interactionsService.getRecentContacts(userId);
  }

  @Post('broadcast')
  async broadcast(
    @Body() data: { programmeId: string; senderId: string; content: string },
  ) {
    return await this.interactionsService.broadcastToProgramme(
      data.programmeId,
      data.senderId,
      data.content,
    );
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
