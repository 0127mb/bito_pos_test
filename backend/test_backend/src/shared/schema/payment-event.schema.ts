import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentEventDocument = HydratedDocument<PaymentEvent>;

@Schema({ timestamps: true })
export class PaymentEvent {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant' })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Order' })
  orderId!: Types.ObjectId;

  @Prop({ required: true })
  status!: string;
}

export const PaymentEventSchema = SchemaFactory.createForClass(PaymentEvent);
