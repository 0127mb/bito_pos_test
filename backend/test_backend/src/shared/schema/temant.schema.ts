import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type TenantDocument = HydratedDocument<Tenant>;
@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug!: string;
}
export const TenantSchema = SchemaFactory.createForClass(Tenant);
