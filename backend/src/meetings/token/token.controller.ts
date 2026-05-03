import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { LiveCheckinDto } from './dto/live-checkin.dto';
import { PostCheckinDto } from './dto/post-checkin.dto';
// import { ExcuseDto } from './dto/excuse.dto';
import { TokenService } from './token.service';
import { Public } from '../../auth/public.decorator';

@Public()
@Controller('meetings/t')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Get meeting info by check-in token' })
  @ApiOkResponse({ description: 'Meeting found' })
  @ApiNotFoundResponse({ description: 'Meeting not found' })
  async getMeeting(@Param('token') token: string, @Req() req: Request) {
    const {
      answer: _,
      linkToken: __,
      ...meeting
    } = await this.tokenService.getMeetingByToken(token);
    if (!(req.session as any).isAdmin) delete (meeting as any).id;
    return meeting;
  }

  @Post(':token/live-checkin')
  @Throttle({ write: {} })
  @HttpCode(200)
  @ApiOperation({ summary: 'Check in during the meeting' })
  @ApiOkResponse({ description: 'Checked in' })
  @ApiForbiddenResponse({ description: 'Live check-in window not open' })
  @ApiConflictResponse({ description: 'Already checked in' })
  @ApiNotFoundResponse({ description: 'User or meeting not found' })
  liveCheckIn(@Param('token') token: string, @Body() dto: LiveCheckinDto) {
    return this.tokenService.liveCheckIn(token, dto);
  }

  @Post(':token/post-checkin')
  @Throttle({ write: {} })
  @HttpCode(200)
  @ApiOperation({ summary: 'Post-meeting check-in before closing deadline' })
  @ApiOkResponse({ description: 'Checked in or wrong answer' })
  @ApiForbiddenResponse({
    description: 'Deadline passed or max retries reached',
  })
  @ApiConflictResponse({
    description: 'Already checked in or already checked in live',
  })
  @ApiNotFoundResponse({ description: 'User or meeting not found' })
  postCheckIn(@Param('token') token: string, @Body() dto: PostCheckinDto) {
    return this.tokenService.postCheckIn(token, dto);
  }

  // @Post(':token/excuse')
  // @HttpCode(200)
  // @ApiOperation({ summary: 'Submit an excuse before the deadline' })
  // @ApiOkResponse({ description: 'Excuse submitted' })
  // @ApiConflictResponse({ description: 'Already submitted' })
  // @ApiForbiddenResponse({ description: 'Excuse deadline passed' })
  // @ApiNotFoundResponse({ description: 'User or meeting not found' })
  // submitExcuse(@Param('token') token: string, @Body() dto: ExcuseDto) {
  //   return this.tokenService.submitExcuse(token, dto);
  // }
}
