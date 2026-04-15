import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Controller('meetings/:id/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @ApiOperation({ summary: 'Get attendance for all users' })
  @ApiOkResponse({ description: 'Meeting with attendance list' })
  @ApiNotFoundResponse({ description: 'Meeting not found' })
  getAttendance(@Param('id') id: string) {
    return this.attendanceService.getAttendance(id);
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Override attendance for a user' })
  @ApiOkResponse({ description: 'Updated attendance record' })
  @ApiNotFoundResponse({ description: 'Meeting or user not found' })
  patchAttendance(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.patchAttendance(id, userId, dto);
  }
}
