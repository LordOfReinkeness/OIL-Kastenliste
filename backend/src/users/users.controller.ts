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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import CreateUserDto from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User created' })
  @ApiConflictResponse({ description: 'RZ ID already exists' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiOkResponse({ description: 'List of users' })
  // TODO: @Admin() once auth is implemented
  findAll() {
    return this.usersService.findAll();
  }

  // must be before /:id to avoid routing conflict
  @Get('lookup/:rzId')
  @ApiOperation({ summary: 'Look up user by RZ ID' })
  @ApiOkResponse({ description: 'User ID and RZ ID' })
  @ApiNotFoundResponse({ description: 'User not found' })
  findByRzId(@Param('rzId') rzId: string) {
    return this.usersService.findByRzId(rzId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by UUID' })
  @ApiOkResponse({ description: 'User found' })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({ description: 'User updated' })
  @ApiNotFoundResponse({ description: 'User not found' })
  // TODO: @Admin() once auth is implemented
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiOkResponse({ description: 'User deleted' })
  @ApiNotFoundResponse({ description: 'User not found' })
  // TODO: @Admin() once auth is implemented
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'deleted' };
  }
}
