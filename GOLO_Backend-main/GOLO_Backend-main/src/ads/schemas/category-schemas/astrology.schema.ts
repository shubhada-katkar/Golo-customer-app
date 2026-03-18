import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AstrologyDocument = Astrology & Document;

@Schema({ _id: false, timestamps: false })
export class Astrology {

  @Prop()
  horoscope: boolean;

  @Prop()
  kundli: boolean;

  @Prop()
  vaastu: boolean;

  @Prop()
  palm: boolean;

  @Prop()
  experience: string;

  @Prop()
  language: string;

  @Prop({ enum: ['call', 'email'] })
  contactMethod: string;

  @Prop({ enum: ['online', 'offline'] })
  demoAvailable: string;

  @Prop()
  fee: string;

  @Prop()
  availabilityTime: string;
}

export const AstrologySchema = SchemaFactory.createForClass(Astrology);