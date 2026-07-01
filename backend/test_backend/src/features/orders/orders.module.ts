import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../../shared/schema/order.schema';
import { Product, ProductSchema } from '../../shared/schema/product.schema';
import { CreateOrderHandler } from './command/create-order/create-order.handler';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [CreateOrderHandler, OrdersService],
})
export class OrdersModule {}
