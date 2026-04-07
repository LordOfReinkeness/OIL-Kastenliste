import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { CheckinDto } from './dto/checkin.dto';
import { ExcuseDto } from './dto/excuse.dto';
import { TokenService } from './token.service';

@Controller('meetings/t')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Get meeting info by check-in token' })
  @ApiOkResponse({ description: 'Meeting found' })
  @ApiNotFoundResponse({ description: 'Meeting not found' })
  getMeeting(@Param('token') token: string) {
    return this.tokenService.getMeetingByToken(token);
  }

  @Post(':token/checkin')
  @HttpCode(200)
  @ApiOperation({ summary: 'Check in to a meeting' })
  @ApiOkResponse({ description: 'Checked in or wrong answer' })
  @ApiConflictResponse({ description: 'Already checked in' })
  @ApiNotFoundResponse({ description: 'User or meeting not found' })
  @ApiForbiddenResponse({ description: 'Max retries reached' })
  checkIn(@Param('token') token: string, @Body() dto: CheckinDto) {
    return this.tokenService.checkIn(token, dto);
  }

  @Post(':token/excuse')
  @HttpCode(200)
  @ApiOperation({ summary: 'Submit an excuse before the deadline' })
  @ApiOkResponse({ description: 'Excuse submitted' })
  @ApiConflictResponse({ description: 'Already submitted' })
  @ApiForbiddenResponse({ description: 'Excuse deadline passed' })
  @ApiNotFoundResponse({ description: 'User or meeting not found' })
  submitExcuse(@Param('token') token: string, @Body() dto: ExcuseDto) {
    return this.tokenService.submitExcuse(token, dto);
  }
}
