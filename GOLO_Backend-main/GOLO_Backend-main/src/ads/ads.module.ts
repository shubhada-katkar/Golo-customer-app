import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdsService } from './ads.service';
import { AdsController } from './ads.controller';
import { Ad, AdSchema } from './schemas/category-schemas/ad.schema';
import { User, UserSchema } from '../users/schemas/user.schema'; // IMPORT User schema
import { KafkaModule } from '../kafka/kafka.module';
import { CloudinaryService } from './cloudinary.service';

@Module({
  imports: [
    ConfigModule,
    // Register Ad model
    MongooseModule.forFeature([{ name: Ad.name, schema: AdSchema }]),

    // 🔴 CRITICAL: Register User model HERE
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    forwardRef(() => KafkaModule),
  ],
  controllers: [AdsController],
  providers: [AdsService, CloudinaryService],
  exports: [AdsService, CloudinaryService],
})
export class AdsModule { }