import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';
import { ChatGateway } from './chat.gateway';

// Import entities
import { Message } from './entities/message.entity';
import { Notification } from './entities/notification.entity';
import { QuestionAnswer } from './entities/question_answer.entity';
import { Rating } from './entities/rating.entity';
import { SupportTicket } from './entities/support_ticket.entity';
import { Application } from '../applications/entities/application.entity';
import { User } from '../users/entities/user.entity'; // --- ADDED IMPORT ---
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Organization } from '../organizations/entities/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      Notification,
      QuestionAnswer,
      Rating,
      SupportTicket,
      Application,
      User,
      Volunteer,
      Organization,
    ]),
  ],
  controllers: [InteractionsController],
  providers: [InteractionsService, ChatGateway],
})
export class InteractionsModule {}
