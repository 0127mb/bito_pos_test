import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  sku!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 0, select: false })
  costPrice!: number;

  @Prop({ required: true, min: 0 })
  stock!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ tenantId: 1, isActive: 1, name: 1 });
