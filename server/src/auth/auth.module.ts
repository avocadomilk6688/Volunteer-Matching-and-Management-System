import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { Volunteer } from '../volunteers/entities/volunteer.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { MailModule } from '../mail/mail.module';

import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

// AuthModule bundles the authentication logic, mail utilities, and database dependencies.
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Volunteer, Organization]),
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey123',
      signOptions: { expiresIn: '60d' },
    }),
  ],
  // Registers the controller to handle incoming HTTP requests.
  controllers: [AuthController],
  // Registers the service to handle the business logic and database work.
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
