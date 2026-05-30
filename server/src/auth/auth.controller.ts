import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

// AuthController defines the 'auth' API prefix for all nested endpoints.
@Controller('auth')
export class AuthController {
  // Injects the AuthService to access the business logic layers.
  constructor(private readonly authService: AuthService) {}

  // Handles incoming POST requests to /auth/register and returns the new user.
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // Passes the validated request body to the service for database persistence.
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // Enforces a standard 200 OK response instead of 201 Created
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Handles incoming POST requests to /auth/forgot-password.
   * Triggered when a user enters their email on the Forgot Password interface.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  /**
   * Handles incoming POST requests to /auth/reset-password.
   * Triggered when a user clicks the email link and submits a new password.
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string, // Matches your frontend 'password' key explicitly
  ) {
    return this.authService.resetPassword(token, password);
  }
}
