import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // 👈 Imported to provide environmental variable access
import { MailService } from './mail.service';

@Module({
  imports: [ConfigModule],
  providers: [MailService],
  exports: [MailService], // Exposes MailService cleanly to AuthService
})
export class MailModule {}
