import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ required: true, enum: ['AD', 'SELLER'] })
  type: string;

  @Prop({ required: true })
  targetId: string;

  @Prop({ default: 'Anonymous' })
  reporterId: string;

  @Prop({ required: true })
  reason: string;

  @Prop()
  details: string;

  @Prop({ default: 'pending', enum: ['pending', 'reviewed', 'resolved'] })
  status: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
