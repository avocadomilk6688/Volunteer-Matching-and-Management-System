import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';
import { ChatGateway } from './chat.gateway'; // Added ChatGateway import

// Import entities
import { Message } from './entities/message.entity';
import { Notification } from './entities/notification.entity';
import { QuestionAnswer } from './entities/question_answer.entity';
import { Rating } from './entities/rating.entity';
import { SupportTicket } from './entities/support_ticket.entity';
import { Application } from '../applications/entities/application.entity'; // Added Application entity

@Module({
  imports: [
    // Registering the entities here creates the Repositories
    TypeOrmModule.forFeature([
      Message,
      Notification,
      QuestionAnswer,
      Rating,
      SupportTicket,
      Application, // Required for broadcastToProgramme SQL logic
    ]),
  ],
  controllers: [InteractionsController],
  providers: [
    InteractionsService,
    ChatGateway, // Required to initialize the WebSocket server
  ],
})
export class InteractionsModule {}
