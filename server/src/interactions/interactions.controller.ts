import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InteractionsService, RecentContact } from './interactions.service';
import { QuestionAnswer } from './entities/question_answer.entity';
import {
  CreateMessageDto,
  CreateNotificationDto,
  CreateQuestionAnswerDto,
  CreateRatingDto,
  CreateSupportTicketDto,
} from './dto/create-interaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('interactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  // --- Q&A Logic ---
  @Get('qa')
  @Roles('admin', 'volunteer', 'organization')
  async findAllQA(): Promise<QuestionAnswer[]> {
    return await this.interactionsService.findAllQA();
  }

  @Post('qa')
  @Roles('admin')
  createQA(@Body() createQuestionAnswerDto: CreateQuestionAnswerDto) {
    return this.interactionsService.createQA(createQuestionAnswerDto);
  }

  @Patch('qa/:id')
  @Roles('admin')
  async updateQA(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateQuestionAnswerDto>,
  ) {
    return await this.interactionsService.updateQA(id, updateDto);
  }

  @Delete('qa/:id')
  @Roles('admin')
  async removeQA(@Param('id') id: string) {
    return await this.interactionsService.removeQA(id);
  }

  // --- Messaging Logic ---

  // ─── 🌟 NEW ENDPOINT: CHAT MESSAGE UNREAD COUNT ───
  // Replaces the broken /interactions/user/:userId logic for chat dots
  @Get('messages/unread/:userId')
  @Roles('admin', 'volunteer', 'organization')
  async getUnreadMessages(@Param('userId') userId: string) {
    return await this.interactionsService.getUnreadMessagesCount(userId);
  }

  // ─── 🌟 NEW ENDPOINT: CHAT READ STATUS FLIP ───
  // Clears the unread database state for a specific user
  @Patch('messages/read/:userId')
  @Roles('admin', 'volunteer', 'organization')
  async markMessagesRead(@Param('userId') userId: string) {
    return await this.interactionsService.markMessagesAsRead(userId);
  }

  @Post('message')
  @Roles('admin', 'volunteer', 'organization')
  createMessage(
    @Body() createMessageDto: CreateMessageDto & { programmeId?: string },
  ) {
    return this.interactionsService.createMessage(createMessageDto);
  }

  @Get('history/:user1/:user2')
  @Roles('admin', 'volunteer', 'organization')
  async getHistory(
    @Param('user1') u1: string,
    @Param('user2') u2: string,
    @Query('programmeId') pId?: string,
  ) {
    return await this.interactionsService.getConversationHistory(u1, u2, pId);
  }

  @Get('contacts/:userId')
  @Roles('admin', 'volunteer', 'organization')
  async getContacts(@Param('userId') userId: string): Promise<RecentContact[]> {
    return await this.interactionsService.getRecentContacts(userId);
  }

  @Post('broadcast')
  @Roles('admin', 'organization')
  async broadcast(
    @Body() data: { programmeId: string; senderId: string; content: string },
  ) {
    return await this.interactionsService.broadcastToProgramme(
      data.programmeId,
      data.senderId,
      data.content,
    );
  }

  @Post('chat/batch')
  @Roles('admin', 'organization')
  async sendBatchAnnouncement(
    @Body() body: { senderId: string; programmeId: string; content: string },
  ) {
    return await this.interactionsService.sendBatchMessage(body);
  }

  // --- Rating & Notification Logic ---
  @Post('rating')
  @Roles('admin', 'volunteer', 'organization')
  createRating(@Body() createRatingDto: CreateRatingDto) {
    return this.interactionsService.createRating(createRatingDto);
  }

  @Post('rating/batch')
  @Roles('admin', 'organization')
  createBatchRatings(@Body() payload: { ratings: any[] }) {
    return this.interactionsService.createBatchRatings(payload);
  }

  @Post('notification')
  @Roles('admin', 'volunteer', 'organization')
  createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.interactionsService.createNotification(createNotificationDto);
  }

  @Post('support-ticket')
  @Roles('admin', 'volunteer', 'organization')
  createSupportTicket(@Body() createSupportTicketDto: CreateSupportTicketDto) {
    return this.interactionsService.createSupportTicket(createSupportTicketDto);
  }

  @Get('support-ticket')
  @Roles('admin')
  async findAllSupportTickets() {
    return await this.interactionsService.findAllTickets();
  }

  @Patch('support-ticket/:id')
  @Roles('admin')
  async updateSupportTicket(
    @Param('id') id: string,
    @Body() updateDto: { status: string },
  ) {
    return await this.interactionsService.updateSupportTicket(id, updateDto);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.interactionsService.findAll();
  }

  // Used for standard bell notifications (do not modify this)
  @Get('user/:userId')
  @Roles('admin', 'volunteer', 'organization')
  async findByUser(@Param('userId') userId: string) {
    return await this.interactionsService.findAllByUserId(userId);
  }
}
