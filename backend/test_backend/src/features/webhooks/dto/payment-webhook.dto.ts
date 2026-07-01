import { IsIn, IsMongoId, IsString } from 'class-validator';

export class PaymentWebhookDto {
  @IsString()
  eventId!: string;

  @IsMongoId()
  tenantId!: string;

  @IsMongoId()
  orderId!: string;

  @IsIn(['paid'])
  status!: 'paid';
}
