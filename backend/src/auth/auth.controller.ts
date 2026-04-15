import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Admin login' })
  @ApiOkResponse({ description: 'Logged in' })
  @ApiUnauthorizedResponse({ description: 'Wrong password' })
  login(@Body() dto: LoginDto, @Req() req: Request): { loggedIn: boolean } {
    if (!this.authService.validatePassword(dto.password)) {
      throw new UnauthorizedException('Invalid password');
    }
    (req.session as any).isAdmin = true;
    return { loggedIn: true };
  }

  @Post('logout')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Admin logout' })
  logout(@Req() req: Request): { loggedIn: boolean } {
    req.session.destroy(() => {});
    return { loggedIn: false };
  }

  @Get('me')
  @Public()
  @ApiOperation({ summary: 'Check admin session status' })
  me(@Req() req: Request): { loggedIn: boolean } {
    return { loggedIn: !!(req.session as any).isAdmin };
  }
}
