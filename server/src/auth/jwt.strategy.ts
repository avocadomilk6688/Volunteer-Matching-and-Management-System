import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey123',
    });
  }

  async validate(payload: { id: string; email: string; role: string }) {
    const user = await this.userRepo.findOne({
      where: { id: payload.id },
      relations: ['volunteer', 'organization', 'organization.registrationRecord', 'admin'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    return user;
  }
}
