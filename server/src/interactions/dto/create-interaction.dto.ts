import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  senderId!: string;

  @IsString()
  @IsNotEmpty()
  receiverId!: string;
}

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  receiverId!: string;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}

export class CreateQuestionAnswerDto {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsOptional()
  answer?: string;

  @IsString()
  @IsNotEmpty()
  adminId!: string;
}

export class CreateRatingDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating!: number; // Changed from 'value' to 'rating' to match Service/Controller usage

  @IsString()
  @IsNotEmpty()
  senderId!: string; // Using 'senderId' instead of 'raterId' to match Service

  @IsString()
  @IsNotEmpty()
  targetVolunteerId!: string; // Using 'targetVolunteerId' instead of 'rateeId'

  @IsString()
  @IsNotEmpty()
  programmeId!: string;

  @IsString()
  @IsOptional()
  senderRole?: string;
}

export class CreateSupportTicketDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsOptional()
  status?: string;
}
