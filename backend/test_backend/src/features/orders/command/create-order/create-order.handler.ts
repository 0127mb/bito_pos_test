import { BadRequestException, ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Product } from '../../../../shared/schema/product.schema';
import {
  Order,
  OrderItem,
  OrderStatus,
} from '../../../../shared/schema/order.schema';
import { CreateOrderCommand } from './create-order.command';

type CreatedOrder = Order & { _id: Types.ObjectId };

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async execute(command: CreateOrderCommand) {
    const tenantId = new Types.ObjectId(command.user.tenantId);
    const cashierId = new Types.ObjectId(command.user.sub);

    const mergedItems = new Map<string, number>();

    for (const item of command.dto.items) {
      const currentQuantity = mergedItems.get(item.productId) ?? 0;
      mergedItems.set(item.productId, currentQuantity + item.quantity);
    }

    const session = await this.connection.startSession();

    try {
      let createdOrder: CreatedOrder | undefined;

      await session.withTransaction(async () => {
        const orderItems: OrderItem[] = [];

        for (const [productId, quantity] of mergedItems.entries()) {
          const productObjectId = new Types.ObjectId(productId);

          const product = await this.productModel
            .findOne({
              _id: productObjectId,
              tenantId,
              isActive: true,
            })
            .select('+costPrice')
            .session(session);

          if (!product) {
            throw new BadRequestException('Product not found or unavailable');
          }

          const stockUpdate = await this.productModel.updateOne(
            {
              _id: productObjectId,
              tenantId,
              stock: { $gte: quantity },
            },
            {
              $inc: { stock: -quantity },
            },
            { session },
          );

          if (stockUpdate.modifiedCount !== 1) {
            throw new ConflictException(`Insufficient stock for ${product.name}`);
          }

          orderItems.push({
            productId: product._id as Types.ObjectId,
            name: product.name,
            sku: product.sku,
            quantity,
            unitPrice: product.price,
            unitCost: product.costPrice,
            lineTotal: product.price * quantity,
          });
        }

        const total = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);

        const [order] = await this.orderModel.create(
          [
            {
              tenantId,
              cashierId,
              status: OrderStatus.PENDING_PAYMENT,
              items: orderItems,
              total,
            },
          ],
          { session },
        );

        createdOrder = order as Order & { _id: Types.ObjectId };
      });

      if (!createdOrder) {
        throw new BadRequestException('Order was not created');
      }

      return {
        id: createdOrder._id.toString(),
        status: createdOrder.status,
        items: createdOrder.items.map((item) => ({
          productId: item.productId.toString(),
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
        total: createdOrder.total,
      };
    } finally {
      await session.endSession();
    }
  }
}
