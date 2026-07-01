import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Order,
  OrderStatus,
} from '../../shared/schema/order.schema';
import type { AuthUser } from '../../shared/types/auth-user.type';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
  ) {}

  async receipt(user: AuthUser, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(orderId),
        tenantId: new Types.ObjectId(user.tenantId),
        status: OrderStatus.PAID,
      })
      .select('_id status items total paidAt')
      .lean();

    if (!order) {
      throw new NotFoundException('Paid receipt not found');
    }

    return {
      id: order._id.toString(),
      status: order.status,
      items: order.items.map((item) => ({
        productId: item.productId.toString(),
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      total: order.total,
      paidAt: order.paidAt,
    };
  }
}
