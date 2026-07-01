import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('payment')
  payment(
    @Body() dto: PaymentWebhookDto,
    @Headers('x-payment-signature') signature: string | undefined,
    @Req() request: RawBodyRequest<Request>,
  ) {
    return this.webhooksService.handlePayment(
      dto,
      signature,
      request.rawBody ?? Buffer.from(JSON.stringify(dto)),
    );
  }
}
