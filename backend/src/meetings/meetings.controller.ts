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
import { Meeting } from './meeting.entity';
import { MeetingsService } from './meetings.service';

@Controller('meetings')
class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiCreatedResponse({ description: 'Meeting created' })
  // TODO: @Admin() once auth is implemented
  create(@Body() dto: CreateMeetingDto) {
    return this.meetingsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all meetings' })
  @ApiOkResponse({ description: 'List of meetings' })
  // TODO: @Admin() once auth is implemented
  findAll() {
    return this.meetingsService.findAll();
  }

  // must be before /:id to avoid routing conflict
  @Get('next')
  @ApiOperation({ summary: 'Get next upcoming meeting' })
  @ApiOkResponse({ description: 'Next meeting' })
  @ApiNotFoundResponse({ description: 'No upcoming meeting' })
  async findNext(): Promise<Meeting> {
    return this.meetingsService.findNext();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a meeting by UUID' })
  @ApiOkResponse({ description: 'Meeting found' })
  @ApiNotFoundResponse({ description: 'Meeting not found' })
  // TODO: @Admin() once auth is implemented
  findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a meeting' })
  @ApiOkResponse({ description: 'Meeting updated' })
  @ApiNotFoundResponse({ description: 'Meeting not found' })
  // TODO: @Admin() once auth is implemented
  update(@Param('id') id: string, @Body() dto: UpdateMeetingDto) {
    return this.meetingsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a meeting' })
  @ApiOkResponse({ description: 'Meeting deleted' })
  @ApiNotFoundResponse({ description: 'Meeting not found' })
  // TODO: @Admin() once auth is implemented
  async remove(@Param('id') id: string) {
    await this.meetingsService.remove(id);
    return { message: 'deleted' };
  }
}

export default MeetingsController;
