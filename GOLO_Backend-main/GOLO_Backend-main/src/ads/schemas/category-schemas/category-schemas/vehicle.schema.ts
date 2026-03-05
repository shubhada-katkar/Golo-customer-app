import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VehicleDocument = Vehicle & Document;

@Schema({ _id: false, timestamps: false })
export class Vehicle {
  @Prop({ required: true, enum: ['Rent', 'Sell'] })
  type: string;

  @Prop()
  vehicleType?: string;

  @Prop()
  brand?: string;

  @Prop()
  model?: string;

  @Prop()
  brandModel?: string;

  @Prop()
  rentAmount?: number;

  @Prop()
  securityDeposit?: number;

  @Prop({ enum: ['Yes', 'No', 'Both'] })
  includesDriver?: string;

  @Prop()
  minRentalDuration?: string;

  @Prop()
  year?: number;

  @Prop({ enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'] })
  fuelType?: string;

  @Prop({ enum: ['Manual', 'Automatic'] })
  transmission?: string;

  @Prop()
  kilometersDriven?: number;

  @Prop()
  price?: number;

  @Prop()
  color: string;

  @Prop()
  insurance: string;

  @Prop()
  registrationNumber: string;

  @Prop()
  ownerNumber: number;

  @Prop({ type: [String] })
  features: string[];

  @Prop()
  condition: string;

  @Prop()
  emiAvailable: boolean;

  @Prop()
  exchangeAvailable: boolean;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);