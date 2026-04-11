import { PartialType } from '@nestjs/mapped-types';
import {
  CreateMessageDto,
  CreateNotificationDto,
  CreateQuestionAnswerDto,
  CreateRatingDto,
  CreateSupportTicketDto,
} from './create-interaction.dto';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {}

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {}

export class UpdateQuestionAnswerDto extends PartialType(
  CreateQuestionAnswerDto,
) {}

export class UpdateRatingDto extends PartialType(CreateRatingDto) {}

export class UpdateSupportTicketDto extends PartialType(
  CreateSupportTicketDto,
) {}
