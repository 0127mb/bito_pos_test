import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import type { AuthUser } from '../../shared/types/auth-user.type';
import { CreateOrderCommand } from './command/create-order/create-order.command';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.commandBus.execute(new CreateOrderCommand(user, dto));
  }

  @Get(':id/receipt')
  receipt(@CurrentUser() user: AuthUser, @Param('id') orderId: string) {
    return this.ordersService.receipt(user, orderId);
  }
}
