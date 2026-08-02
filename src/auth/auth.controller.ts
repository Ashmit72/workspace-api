import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard';
import { LoginDto, SignupDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
   constructor(private authService: AuthService) { }

   @UseGuards(JwtAuthGuard)
   @Get('me')
   getProfile(@Req() req) {
      return req.user;
   }

   @Post('signup')
   signup(@Body() signupDto: SignupDto) {
      return this.authService.signup(signupDto.email, signupDto.password)
   }

   @Post('login')
   login(@Body() loginDto: LoginDto) {
      return this.authService.login(loginDto.email, loginDto.password)
   }
}
