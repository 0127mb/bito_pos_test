import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { createHmac, timingSafeEqual } from 'crypto';
import { Connection, Model, Types } from 'mongoose';
import { SalesReportCacheService } from '../../shared/cache/sales-report-cache.service';
import {
  Order,
  OrderStatus,
} from '../../shared/schema/order.schema';
import { PaymentEvent } from '../../shared/schema/payment-event.schema';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    @InjectModel(PaymentEvent.name)
    private readonly paymentEventModel: Model<PaymentEvent>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly salesReportCache: SalesReportCacheService,
  ) {}

  async handlePayment(dto: PaymentWebhookDto, signature: string | undefined, rawBody: Buffer) {
    this.verifySignature(signature, rawBody);

    const tenantId = new Types.ObjectId(dto.tenantId);
    const orderId = new Types.ObjectId(dto.orderId);
    const session = await this.connection.startSession();

    try {
      let duplicate = false;

      await session.withTransaction(async () => {
        const existingEvent = await this.paymentEventModel
          .findOne({ eventId: dto.eventId })
          .session(session);

        if (existingEvent) {
          duplicate = true;
          return;
        }

        const order = await this.orderModel
          .findOne({ _id: orderId, tenantId })
          .session(session);

        if (!order) {
          throw new BadRequestException('Unknown order or tenant');
        }

        await this.paymentEventModel.create(
          [
            {
              eventId: dto.eventId,
              tenantId,
              orderId,
              status: dto.status,
            },
          ],
          { session },
        );

        if (order.status === OrderStatus.PENDING_PAYMENT) {
          await this.orderModel.updateOne(
            { _id: orderId, tenantId, status: OrderStatus.PENDING_PAYMENT },
            { $set: { status: OrderStatus.PAID, paidAt: new Date() } },
            { session },
          );
          this.salesReportCache.invalidateTenant(tenantId.toString());
        }
      });

      return { received: true, duplicate };
    } finally {
      await session.endSession();
    }
  }

  private verifySignature(signature: string | undefined, rawBody: Buffer) {
    if (!signature) {
      throw new UnauthorizedException('Missing signature');
    }

    const secret = this.configService.getOrThrow<string>('PAYMENT_WEBHOOK_SECRET');
    const digest = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expected = signature.startsWith('sha256=')
      ? `sha256=${digest}`
      : digest;

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid signature');
    }
  }
}
