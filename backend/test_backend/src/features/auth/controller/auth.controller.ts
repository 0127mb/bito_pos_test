import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoginCommand } from '../command/login/login.command';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt.auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import type { AuthUser } from 'src/shared/types/auth-user.type';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.commandBus.execute(new LoginCommand(dto));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
