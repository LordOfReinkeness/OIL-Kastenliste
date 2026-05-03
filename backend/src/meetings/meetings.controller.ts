import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { MeetingsService } from './meetings.service';
import { TokenService } from './token/token.service';
import { ExcuseDto } from './token/dto/excuse.dto';
import { Public } from '../auth/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('meetings')
class MeetingsController {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly tokenService: TokenService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiCreatedResponse({ description: 'Meeting created' })
  create(@Body() dto: CreateMeetingDto) {
    return this.meetingsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all meetings' })
  @ApiOkResponse({ description: 'List of meetings' })
  findAll() {
    return this.meetingsService.findAll();
  }

  // must be before /:id to avoid routing conflict
  @Get('next')
  @Public()
  @ApiOperation({ summary: 'Get next upcoming meeting' })
  @ApiOkResponse({ description: 'Next meeting' })
  @ApiNotFoundResponse({ description: 'No upcoming meeting' })
  async findNext() {
    const { id: _, linkToken: __, ...meeting } = await this.meetingsService.findNext();
    return meeting;
  }

  // must be before /:id to avoid routing conflict
  @Post('next/excuse')
  @Public()
  @Throttle({ write: {} })
  @HttpCode(200)
  @ApiOperation({ summary: 'Submit an excuse for the next upcoming meeting' })
  @ApiOkResponse({ description: 'Excuse submitted' })
  @ApiNotFoundResponse({ description: 'No upcoming meeting or user not found' })
  async excuseNextMeeting(@Body() dto: ExcuseDto) {
    const meeting = await this.meetingsService.findNext();
    return this.tokenService.submitExcuseForMeeting(meeting, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a meeting by UUID' })
  @ApiOkResponse({ description: 'Meeting found' })
  @ApiNotFoundResponse({ description: 'Meeting not found' })
  findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a meeting' })
  @ApiOkResponse({ description: 'Meeting updated' })
  @ApiNotFoundResponse({ description: 'Meeting not found' })
  update(@Param('id') id: string, @Body() dto: UpdateMeetingDto) {
    return this.meetingsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a meeting' })
  @ApiOkResponse({ description: 'Meeting deleted' })
  @ApiNotFoundResponse({ description: 'Meeting not found' })
  async remove(@Param('id') id: string) {
    await this.meetingsService.remove(id);
    return { message: 'deleted' };
  }
}

export default MeetingsController;
