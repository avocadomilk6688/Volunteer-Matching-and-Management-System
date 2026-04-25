import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

// AuthController defines the 'auth' API prefix for all nested endpoints.
@Controller('auth')
export class AuthController {
  // Injects the AuthService to access the registration logic.
  constructor(private readonly authService: AuthService) {}

  // Handles incoming POST requests to /auth/register and returns the new user.
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // Passes the validated request body to the service for database persistence.
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
