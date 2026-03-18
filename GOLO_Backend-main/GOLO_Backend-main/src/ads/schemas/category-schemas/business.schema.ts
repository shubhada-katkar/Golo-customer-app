import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BusinessDocument = Business & Document;

@Schema({ _id: false, timestamps: false })
export class Business {

  @Prop({ required: true })
  businessName: string;

  @Prop()
  businessType: string;

  @Prop()
  serviceOffered: string;

  @Prop()
  gstNumber: string;

  @Prop()
  websiteUrl: string;

  @Prop({ type: [String] })
  socialMediaLinks: string[];

  @Prop()
  campaignName: string;

  @Prop()
  validTill: string;

  @Prop()
  description: string;

  @Prop()
  shopAddress: string;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);