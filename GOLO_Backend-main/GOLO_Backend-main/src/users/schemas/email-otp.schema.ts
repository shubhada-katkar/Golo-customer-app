import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailOtpDocument = EmailOtp & Document;

@Schema({ timestamps: true })
export class EmailOtp {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true })
  purpose: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ required: true })
  expiresAt: Date;
}

export const EmailOtpSchema = SchemaFactory.createForClass(EmailOtp);

EmailOtpSchema.index({ email: 1, purpose: 1 }, { unique: true });
EmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });