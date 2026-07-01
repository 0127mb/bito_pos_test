import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalesReportCacheService } from '../../shared/cache/sales-report-cache.service';
import { Order, OrderSchema } from '../../shared/schema/order.schema';
import {
  PaymentEvent,
  PaymentEventSchema,
} from '../../shared/schema/payment-event.schema';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: PaymentEvent.name, schema: PaymentEventSchema },
    ]),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, SalesReportCacheService],
})
export class WebhooksModule {}
