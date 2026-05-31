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
  value!: number;

  @IsString()
  @IsNotEmpty()
  raterId!: string;

  @IsString()
  @IsNotEmpty()
  rateeId!: string;
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
