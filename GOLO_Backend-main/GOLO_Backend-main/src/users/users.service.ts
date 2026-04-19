import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException, ForbiddenException, Logger, InternalServerErrorException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { EmailOtp, EmailOtpDocument } from './schemas/email-otp.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { KafkaService } from '../kafka/kafka.service';
import { KAFKA_TOPICS } from '../common/constants/kafka-topics';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import * as nodemailer from 'nodemailer';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  private twilioClient: any;
  private mailTransporter?: nodemailer.Transporter;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(EmailOtp.name) private emailOtpModel: Model<EmailOtpDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Optional() private kafkaService?: KafkaService,
  ) {
    // initialize twilio client if credentials provided
    const sid = this.configService.get('TWILIO_SID');
    const auth = this.configService.get('TWILIO_AUTH');
    const phone = this.configService.get('TWILIO_PHONE');
    this.logger.debug(`Twilio config sid=${!!sid} auth=${!!auth} phone=${!!phone}`);
    if (sid && auth) {
      this.twilioClient = twilio(sid, auth);
    } else {
      this.logger.warn('Twilio credentials missing; SMS functionality disabled');
    }

    const emailUser = this.configService.get<string>('config.email.user') || this.configService.get<string>('EMAIL');
    const emailPass = this.configService.get<string>('config.email.pass') || this.configService.get<string>('EMAIL_PASS');

    if (emailUser && emailPass) {
      this.mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    } else {
      this.logger.warn('Email credentials missing; OTP email functionality disabled');
    }
  }

  // ==================== PUBLIC METHODS ====================

  async register(registerDto: RegisterDto): Promise<UserResponseDto> {
    const normalizedEmail = this.normalizeEmail(registerDto.email);
    this.logger.log(`Registering new user: ${normalizedEmail}`);
    await this.assertVerifiedRegistrationOtp(normalizedEmail, registerDto.otp);
    
    // Check if user exists
    const existingUser = await this.userModel.findOne({ email: normalizedEmail }).exec();
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user (always USER role by default)
    const user = new this.userModel({
      name: registerDto.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.USER,
      isEmailVerified: true,
      profile: {
        phone: registerDto.phone,
      },
      metadata: {
        registeredIp: '0.0.0.0',
      },
      refreshTokens: [],
    });

    const savedUser = await user.save();
  await this.emailOtpModel.deleteOne({ email: normalizedEmail, purpose: 'registration' }).exec();

    // Emit Kafka event
    if (this.kafkaService) {
      await this.kafkaService.emit(KAFKA_TOPICS.USER_REGISTERED, {
        userId: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
        timestamp: new Date().toISOString(),
      });
    } else {
      this.logger.warn('Kafka disabled - USER_REGISTERED event skipped');
    }

    return this.toResponseDto(savedUser);
  }

  async login(loginDto: LoginDto, ip?: string): Promise<{ accessToken: string; refreshToken: string; user: UserResponseDto }> {
    const normalizedEmail = this.normalizeEmail(loginDto.email);
    this.logger.log(`Login attempt: ${normalizedEmail}`);
    
    const user = await this.userModel.findOne({ email: normalizedEmail }).exec();
    if (!user) {
      this.logger.warn(`Login failed - user not found: ${normalizedEmail}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Verify your email before logging in');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed - invalid password: ${normalizedEmail}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
    });

    // Save refresh token
    await this.userModel.updateOne(
      { _id: user._id },
      {
        $push: { refreshTokens: refreshToken },
        $set: { 'metadata.lastLoginAt': new Date(), 'metadata.lastLoginIp': ip },
      }
    ).exec();

    // Emit Kafka event
    if (this.kafkaService) {
      await this.kafkaService.emit(KAFKA_TOPICS.USER_LOGGED_IN, {
        userId: user._id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });
    } else {
      this.logger.warn('Kafka disabled - USER_LOGGED_IN event skipped');
    }

    this.logger.log(`Login successful: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      user: this.toResponseDto(user),
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userModel.findById(payload.sub).exec();
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { sub: user._id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
      });

      return { accessToken };
    } catch (error) {
      this.logger.error(`Refresh token failed: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    this.logger.log(`Logout user: ${userId}`);
    
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: refreshToken } }
    ).exec();

    if (this.kafkaService) {
      await this.kafkaService.emit(KAFKA_TOPICS.USER_LOGGED_OUT, {
        userId,
        timestamp: new Date().toISOString(),
      });
    } else {
      this.logger.warn('Kafka disabled - USER_LOGGED_OUT event skipped');
    }
  }

  // ==================== USER METHODS ====================

  async getProfile(userId: string): Promise<UserResponseDto> {
    this.logger.log(`Getting profile for user: ${userId}`);
    
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toResponseDto(user);
  }

  async updateProfile(
    userId: string,
    updateData: any,
    file?: { buffer: Buffer; originalname?: string },
    cloudinaryService?: any,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating profile for user: ${userId}`);
    this.logger.debug(`Update data received: ${JSON.stringify(updateData)}`);
    
    // Only allow updating specific fields
    const allowedUpdates: any = {};
    
    if (updateData.name) allowedUpdates.name = updateData.name;
    if (updateData.phone) allowedUpdates['profile.phone'] = updateData.phone;
    if (updateData.profile?.phone) allowedUpdates['profile.phone'] = updateData.profile.phone;
    if (updateData.profile?.address) allowedUpdates['profile.address'] = updateData.profile.address;
    if (updateData.profile?.city) allowedUpdates['profile.city'] = updateData.profile.city;
    if (updateData.profile?.state) allowedUpdates['profile.state'] = updateData.profile.state;
    if (updateData.profile?.pincode) allowedUpdates['profile.pincode'] = updateData.profile.pincode;
    if (updateData.profile?.bio) allowedUpdates['profile.bio'] = updateData.profile.bio;

    // Handle image upload to Cloudinary
    if (file && cloudinaryService) {
      try {
        const imageUrl = await cloudinaryService.uploadImage(file.buffer, `user-${userId}-avatar`);
        allowedUpdates['profile.avatar'] = imageUrl;
        this.logger.log(`Profile image uploaded to Cloudinary: ${imageUrl}`);
      } catch (error) {
        this.logger.error(`Cloudinary upload failed: ${error.message}`);
        throw new InternalServerErrorException('Failed to upload profile image');
      }
    } else if (updateData.profile?.avatar) {
      // Fallback for backward compatibility (non-file avatar URLs)
      allowedUpdates['profile.avatar'] = updateData.profile.avatar;
    }

    this.logger.debug(`Allowed updates: ${JSON.stringify(allowedUpdates)}`);

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { ...allowedUpdates, updatedAt: new Date() } },
      { new: true }
    ).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  async sendEmailChangeOtp(userId: string, email: string): Promise<any> {
    if (!email || !String(email).trim()) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalizedEmail = this.normalizeEmail(email);
    if (normalizedEmail === this.normalizeEmail(user.email)) {
      throw new BadRequestException('This is already your current email');
    }

    const existingUser = await this.userModel.findOne({
      email: normalizedEmail,
      _id: { $ne: userId },
    }).exec();

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const purpose = `email_change:${userId}`;

    await this.emailOtpModel.findOneAndUpdate(
      { email: normalizedEmail, purpose },
      {
        $set: {
          otp,
          expiresAt,
          verified: false,
        },
        $setOnInsert: {
          email: normalizedEmail,
          purpose,
        },
      },
      {
        upsert: true,
        new: true,
      },
    ).exec();

    await this.sendOtpEmail(
      normalizedEmail,
      otp,
      'GOLO email change OTP',
      'Use this OTP to verify your new email for your GOLO account.',
    );

    return {
      email: normalizedEmail,
      expiresIn: 300,
    };
  }

  async verifyEmailChangeOtp(userId: string, email: string, otp: string): Promise<UserResponseDto> {
    if (!email || !String(email).trim()) {
      throw new BadRequestException('Email is required');
    }

    if (!otp || !String(otp).trim()) {
      throw new BadRequestException('OTP is required');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const purpose = `email_change:${userId}`;

    const entry = await this.emailOtpModel
      .findOne({ email: normalizedEmail, purpose })
      .exec();

    if (!entry) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (new Date() > entry.expiresAt) {
      await this.emailOtpModel.deleteOne({ _id: entry._id }).exec();
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (entry.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const existingUser = await this.userModel.findOne({
      email: normalizedEmail,
      _id: { $ne: userId },
    }).exec();

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          email: normalizedEmail,
          isEmailVerified: true,
          updatedAt: new Date(),
        },
      },
      { new: true },
    ).exec();

    await this.emailOtpModel.deleteOne({ _id: entry._id }).exec();

    return this.toResponseDto(updatedUser);
  }

  async findById(userId: string): Promise<UserResponseDto> {
    try {
      this.logger.log(`Find by ID: ${userId}`);
      
      // Check if userId is a valid ObjectId format
      if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('Invalid user ID format');
      }
      
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      return this.toResponseDto(user);
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid user ID format');
      }
      this.logger.error(`Error in findById: ${error.message}`);
      throw error;
    }
  }

  // 🔴 FIXED: getUserById method with proper logging
  async getUserById(userId: string): Promise<UserResponseDto> {
    try {
      this.logger.log(`Getting user by ID: ${userId}`);
      
      // Check if userId is a valid ObjectId format
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        this.logger.warn(`Invalid user ID format: ${userId}`);
        throw new BadRequestException('Invalid user ID format');
      }
      
      // Find user in database
      const user = await this.userModel.findById(userId).exec();
      
      // Check if user exists
      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      this.logger.log(`User found: ${user.email}`);
      return this.toResponseDto(user);
      
    } catch (error) {
      // Handle different types of errors
      if (error.name === 'CastError') {
        this.logger.error(`Cast error for ID ${userId}`);
        throw new BadRequestException('Invalid user ID format');
      }
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(`Unexpected error getting user ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Failed to get user');
    }
  }

  async getPublicUserById(userId: string): Promise<any> {
    try {
      this.logger.log(`Getting public user by ID: ${userId}`);
      
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('Invalid user ID format');
      }
      
      const user = await this.userModel.findById(userId).exec();
      
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // Select safe fields to expose to guests
      return {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        profile: {
          avatar: user.profile?.avatar || null,
          phone: user.profile?.phone || null,
          city: user.profile?.city || null,
          state: user.profile?.state || null,
          bio: user.profile?.bio || null,
        },
        createdAt: user.createdAt,
      };
      
    } catch (error) {
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid user ID format');
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to get public user stats');
    }
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.userModel.findOne({ email }).exec();
    return user ? this.toResponseDto(user) : null;
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{ users: UserResponseDto[]; total: number }> {
    this.logger.log(`Getting all users - Page: ${page}, Limit: ${limit}`);
    
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.userModel
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments()
    ]);

    return {
      users: users.map(user => this.toResponseDto(user)),
      total,
    };
  }

  // ==================== ADMIN METHODS ====================

  async adminGetAllUsers(page: number = 1, limit: number = 10): Promise<{ users: UserResponseDto[]; total: number }> {
    this.logger.log(`Admin getting all users - Page: ${page}, Limit: ${limit}`);
    return this.getAllUsers(page, limit);
  }

  async adminGetUserById(userId: string): Promise<UserResponseDto> {
    this.logger.log(`Admin getting user by ID: ${userId}`);
    return this.findById(userId);
  }

  async adminUpdateUser(userId: string, updateData: any): Promise<UserResponseDto> {
    this.logger.log(`Admin updating user: ${userId}`);
    
    // Admin can update any field
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true }
    ).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  async adminDeleteUser(userId: string): Promise<void> {
    this.logger.log(`Admin deleting user: ${userId}`);
    
    const result = await this.userModel.deleteOne({ _id: userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('User not found');
    }

    if (this.kafkaService) {
      await this.kafkaService.emit(KAFKA_TOPICS.USER_DELETED, {
        userId,
        timestamp: new Date().toISOString(),
      });
    } else {
      this.logger.warn('Kafka disabled - USER_DELETED event skipped');
    }
  }

  async adminGetStats(): Promise<any> {
    this.logger.log('Admin getting stats');
    
    const totalUsers = await this.userModel.countDocuments();
    const totalAdmins = await this.userModel.countDocuments({ role: UserRole.ADMIN });
    const totalRegularUsers = await this.userModel.countDocuments({ role: UserRole.USER });
    const recentUsers = await this.userModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    return {
      totalUsers,
      totalAdmins,
      totalRegularUsers,
      recentUsers: recentUsers.map(u => this.toResponseDto(u)),
    };
  }

  // ==================== PASSWORD CHANGE with OTP ====================

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendRegistrationOtp(email: string): Promise<any> {
    const normalizedEmail = this.normalizeEmail(email);
    const existingUser = await this.userModel.findOne({ email: normalizedEmail }).exec();

    if (existingUser?.isEmailVerified) {
      throw new ConflictException('User with this email already exists');
    }

    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.emailOtpModel.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'registration' },
      {
        $set: {
          otp,
          expiresAt,
          verified: false,
        },
        $setOnInsert: {
          email: normalizedEmail,
          purpose: 'registration',
        },
      },
      {
        upsert: true,
        new: true,
      },
    ).exec();

    await this.sendOtpEmail(
      normalizedEmail,
      otp,
      'GOLO registration OTP',
      'Use this OTP to verify your GOLO account registration.',
    );

    return {
      email: normalizedEmail,
      expiresIn: 300,
    };
  }

  async verifyRegistrationOtp(email: string, otp: string): Promise<any> {
    const normalizedEmail = this.normalizeEmail(email);
    const entry = await this.emailOtpModel.findOne({ email: normalizedEmail, purpose: 'registration' }).exec();
    const existingUser = await this.userModel.findOne({ email: normalizedEmail }).exec();

    if (!entry) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (new Date() > entry.expiresAt) {
      await this.emailOtpModel.deleteOne({ _id: entry._id }).exec();
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (entry.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.emailOtpModel.updateOne(
      { _id: entry._id },
      {
        $set: {
          verified: true,
        },
      },
    ).exec();

    if (existingUser && !existingUser.isEmailVerified) {
      await this.userModel.updateOne(
        { _id: existingUser._id },
        {
          $set: {
            isEmailVerified: true,
            updatedAt: new Date(),
          },
        },
      ).exec();
    }

    return { email: normalizedEmail, verified: true };
  }

  async sendPasswordChangeOTP(userId: string): Promise<any> {
    this.logger.log(`Sending password change OTP for user: ${userId}`);
    
    try {
      // Validate userId - handle both string and ObjectId
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }
      
      const userIdStr = userId.toString();
      this.logger.debug(`Processing userId: ${userIdStr}`);

      // Get full user document with all fields
      const user = await this.userModel.findById(userIdStr).exec();
      if (!user) {
        this.logger.warn(`User not found with ID: ${userIdStr}`);
        throw new NotFoundException('User not found');
      }
      
      this.logger.debug(`User found: ${user.email}`);

      const otp = this.generateOTP();
      const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Save OTP and reset verification status
      await this.userModel.findByIdAndUpdate(
        userIdStr,
        {
          $set: {
            passwordChangeOTP: otp,
            passwordChangeOTPExpiry: expiryTime,
            passwordChangeOTPVerified: false,
            updatedAt: new Date(),
          }
        },
        { new: true }
      ).exec();

      await this.sendOtpEmail(
        user.email,
        otp,
        'GOLO password change OTP',
        'Use this OTP to confirm your password change request.',
      );

      return {
        message: 'OTP sent to registered email',
        expiresIn: 300, // 5 minutes in seconds
      };
    } catch (error) {
      this.logger.error(`Error in sendPasswordChangeOTP: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw error;
    }
  }

  async verifyPasswordChangeOTP(userId: string, otp: string): Promise<any> {
    this.logger.log(`Verifying password change OTP for user: ${userId}`);
    
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordChangeOTP) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (new Date() > user.passwordChangeOTPExpiry) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (user.passwordChangeOTP !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark OTP as verified
    await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          passwordChangeOTPVerified: true,
          updatedAt: new Date(),
        }
      }
    ).exec();

    return { message: 'OTP verified successfully' };
  }

  async changePasswordWithOTP(userId: string, otp: string, newPassword: string): Promise<UserResponseDto> {
    this.logger.log(`Changing password with OTP for user: ${userId}`);
    
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordChangeOTPVerified) {
      throw new BadRequestException('OTP not verified. Please verify OTP first.');
    }

    if (user.passwordChangeOTP !== otp) {
      throw new UnauthorizedException('OTP mismatch');
    }

    if (new Date() > user.passwordChangeOTPExpiry) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          password: hashedPassword,
          passwordChangeOTP: null,
          passwordChangeOTPExpiry: null,
          passwordChangeOTPVerified: false,
          updatedAt: new Date(),
        }
      },
      { new: true }
    ).exec();

    this.logger.log(`Password changed successfully for user: ${userId}`);

    return this.toResponseDto(updatedUser);
  }

  async sendForgotPasswordOtp(email: string): Promise<any> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userModel.findOne({ email: normalizedEmail }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = this.generateOTP();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000);

    await this.userModel.findByIdAndUpdate(
      user._id,
      {
        $set: {
          passwordChangeOTP: otp,
          passwordChangeOTPExpiry: expiryTime,
          passwordChangeOTPVerified: false,
          updatedAt: new Date(),
        },
      },
    ).exec();

    await this.sendOtpEmail(
      normalizedEmail,
      otp,
      'GOLO forgot password OTP',
      'Use this OTP to reset your GOLO account password.',
    );

    return {
      email: normalizedEmail,
      expiresIn: 300,
    };
  }

  async verifyForgotPasswordOtp(email: string, otp: string): Promise<any> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userModel.findOne({ email: normalizedEmail }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordChangeOTP) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (!user.passwordChangeOTPExpiry || new Date() > user.passwordChangeOTPExpiry) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (user.passwordChangeOTP !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.userModel.findByIdAndUpdate(user._id, {
      $set: {
        passwordChangeOTPVerified: true,
        updatedAt: new Date(),
      },
    }).exec();

    return { email: normalizedEmail, verified: true };
  }

  async resetPasswordWithOtp(email: string, otp: string, newPassword: string): Promise<UserResponseDto> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userModel.findOne({ email: normalizedEmail }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordChangeOTPVerified) {
      throw new BadRequestException('OTP not verified. Please verify OTP first.');
    }

    if (!user.passwordChangeOTPExpiry || new Date() > user.passwordChangeOTPExpiry) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (user.passwordChangeOTP !== otp) {
      throw new UnauthorizedException('OTP mismatch');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await this.userModel.findByIdAndUpdate(
      user._id,
      {
        $set: {
          password: hashedPassword,
          passwordChangeOTP: null,
          passwordChangeOTPExpiry: null,
          passwordChangeOTPVerified: false,
          refreshTokens: [],
          updatedAt: new Date(),
        },
      },
      { new: true },
    ).exec();

    return this.toResponseDto(updatedUser);
  }

  // ==================== HELPER METHODS ====================

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async assertVerifiedRegistrationOtp(email: string, otp: string): Promise<void> {
    const entry = await this.emailOtpModel.findOne({ email, purpose: 'registration' }).exec();

    if (!entry) {
      throw new BadRequestException('Send OTP to your email before registering.');
    }

    if (new Date() > entry.expiresAt) {
      await this.emailOtpModel.deleteOne({ _id: entry._id }).exec();
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (!entry.verified || entry.otp !== otp) {
      throw new BadRequestException('Verify your email OTP before registering.');
    }
  }

  private async sendOtpEmail(email: string, otp: string, subject: string, purpose: string): Promise<void> {
    if (!this.mailTransporter) {
      throw new InternalServerErrorException('Email service is not configured');
    }

    const fromAddress =
      this.configService.get<string>('config.email.from') ||
      this.configService.get<string>('EMAIL_FROM') ||
      this.configService.get<string>('config.email.user') ||
      this.configService.get<string>('EMAIL');

    await this.mailTransporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1f2937;">
          <h2 style="margin: 0 0 12px; color: #157a4f;">GOLO verification</h2>
          <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5;">${purpose}</p>
          <div style="letter-spacing: 8px; font-size: 28px; font-weight: 700; background: #f3f4f6; padding: 16px 20px; border-radius: 12px; text-align: center; color: #111827;">
            ${otp}
          </div>
          <p style="margin: 16px 0 0; font-size: 13px; color: #6b7280;">This OTP expires in 5 minutes.</p>
        </div>
      `,
    });
  }

  private toResponseDto(user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified || false,
      profile: user.profile || {},
      createdAt: user.createdAt,
    };
  }
}