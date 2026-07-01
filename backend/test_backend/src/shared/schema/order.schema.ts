import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
}

@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Product' })
  productId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  sku!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;

  @Prop({ required: true, min: 0 })
  lineTotal!: number;

  @Prop({ required: true, min: 0, select: false })
  unitCost!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  cashierId!: Types.ObjectId;

  @Prop({ required: true, type: String, enum: Object.values(OrderStatus), index: true })
  status!: OrderStatus;

  @Prop({ required: true, type: [OrderItemSchema] })
  items!: OrderItem[];

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop()
  paidAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
