import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Role } from '../enum/Role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, type: String, enum: Object.values(Role) })
  role!: Role;

  @Prop({ required: true, trim: true })
  name!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
