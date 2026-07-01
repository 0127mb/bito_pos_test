import type { AuthUser } from '../../../../shared/types/auth-user.type';
import { CreateOrderDto } from '../../dto/create-order.dto';

export class CreateOrderCommand {
  constructor(
    public readonly user: AuthUser,
    public readonly dto: CreateOrderDto,
  ) {}
}
