import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder, Types } from 'mongoose';
import { Ad, AdDocument } from './schemas/category-schemas/ad.schema';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { KafkaService } from '../kafka/kafka.service';
import { KAFKA_TOPICS } from '../common/constants/kafka-topics';
import { v4 as uuidv4 } from 'uuid';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    @InjectModel(Ad.name) private readonly adModel: Model<AdDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,

    // ✅ Kafka OPTIONAL
    @Optional() private readonly kafkaService?: KafkaService,
  ) { }

  /* ============================================================
     CREATE AD
  ============================================================ */

  async createAd(createAdDto: CreateAdDto): Promise<Ad> {
    this.logger.log(`Creating new ad for user: ${createAdDto.userId}`);

    const postingUser = await this.userModel.findById(String(createAdDto.userId)).lean().exec();
    if (!postingUser) {
      throw new BadRequestException(
        `User with ID ${createAdDto.userId} not found.`,
      );
    }

    let categorySpecificData: any = {};

    switch (createAdDto.category) {
      case 'Vehicle':
        categorySpecificData = createAdDto.vehicleData || {};
        break;
      case 'Property':
        categorySpecificData = createAdDto.propertyData || {};
        break;
      case 'Service':
        categorySpecificData = createAdDto.serviceData || {};
        break;
      case 'Mobiles':
        categorySpecificData = createAdDto.mobileData || {};
        break;
      case 'Electronics & Home appliances':
        categorySpecificData = createAdDto.electronicsData || {};
        break;
      case 'Furniture':
        categorySpecificData = createAdDto.furnitureData || {};
        break;
      case 'Education':
        categorySpecificData = createAdDto.educationData || {};
        break;
      case 'Pets':
        categorySpecificData = createAdDto.petsData || {};
        break;
      case 'Matrimonial':
        categorySpecificData = createAdDto.matrimonialData || {};
        break;
      case 'Business':
        categorySpecificData = createAdDto.businessData || {};
        break;
      case 'Travel':
        categorySpecificData = createAdDto.travelData || {};
        break;
      case 'Astrology':
        categorySpecificData = createAdDto.astrologyData || {};
        break;
      case 'Employment':
        categorySpecificData = createAdDto.employmentData || {};
        break;
      case 'Lost & Found':
        categorySpecificData = createAdDto.lostFoundData || {};
        break;
      case 'Personal':
        categorySpecificData = createAdDto.personalData || {};
        break;
      case 'Greetings':
        categorySpecificData = createAdDto.greetingsData || {};
        break;
      case 'Others':
        categorySpecificData = createAdDto.othersData || {};
        break;
      case 'Public Notice':
        categorySpecificData = createAdDto.publicNoticeData || {};
        break;
    }

    this.validateCategoryData(createAdDto.category, categorySpecificData);

    const selectedDates = Array.isArray(createAdDto.selectedDates)
      ? createAdDto.selectedDates
        .map((d: any) => new Date(d))
        .filter((d: Date) => !Number.isNaN(d.getTime()))
        .sort((a: Date, b: Date) => a.getTime() - b.getTime())
      : [];

    const startDate = selectedDates.length > 0 ? selectedDates[0] : null;
    const endDate = selectedDates.length > 0 ? selectedDates[selectedDates.length - 1] : null;

    const expiryDate =
      endDate ||
      createAdDto.expiryDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const now = new Date();
    const resolvedStatus = expiryDate && new Date(expiryDate) < now ? 'expired' : 'active';

    const adData: any = {
      ...createAdDto,
      selectedDates,
      categorySpecificData,
      contactInfo: {
        ...(createAdDto as any)?.contactInfo,
        name: postingUser?.name || (createAdDto as any)?.contactInfo?.name || '',
      },
      adId: uuidv4(),
      status: resolvedStatus,
      views: 0,
      cardClicks: 0,
      uniqueVisitors: 0,
      contactClicks: 0,
      wishlistSaves: 0,
      expiryDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savedAd = await new this.adModel(adData).save();

    this.logger.log(`Ad created successfully: ${savedAd.adId}`);

    await this.emitAdCreated(savedAd, uuidv4());

    return savedAd;
  }

  /* ============================================================
     ADMIN
  ============================================================ */

  async adminDeleteAd(adId: string): Promise<void> {
    await this.adModel.findOneAndDelete({ adId }).exec();
  }

  async adminGetAllAds(): Promise<Ad[]> {
    return this.adModel.find().sort({ createdAt: -1 }).exec();
  }

  /* ============================================================
     USER VERIFY
  ============================================================ */

  async verifyUser(userId: any): Promise<boolean> {
    try {
      if (!userId) return false;

      const userIdStr = String(userId);

      if (!userIdStr.match(/^[0-9a-fA-F]{24}$/)) return false;

      const user = await this.userModel
        .findById(userIdStr)
        .lean()
        .exec();

      return !!user;
    } catch (error: any) {
      this.logger.error(`User verify error: ${error.message}`);
      return false;
    }
  }

  /* ============================================================
     GETTERS
  ============================================================ */

  async getAdById(adId: string): Promise<Ad> {
    // Try _id lookup only when adId is a valid ObjectId; otherwise use UUID-based adId lookup.
    let ad: Ad | null = null;

    if (Types.ObjectId.isValid(adId)) {
      ad = await this.adModel.findById(adId).exec();
    }

    if (!ad) {
      ad = await this.adModel.findOne({ adId }).exec();
    }

    if (!ad) throw new NotFoundException(`Ad ${adId} not found`);
    return ad;
  }

  async getAdsByCategory(
    category: string,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  ): Promise<{ ads: Ad[]; total: number }> {
    await this.refreshDateDrivenStatuses();

    const skip = (page - 1) * limit;

    const sort: { [key: string]: SortOrder } = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const visibilityQuery = this.buildPublicVisibilityQuery();

    const [ads, total] = await Promise.all([
      this.adModel
        .find({ ...visibilityQuery, category })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.adModel.countDocuments({
        ...visibilityQuery,
        category,
      }),
    ]);

    return { ads, total };
  }

  /* ============================================================
     SEARCH / LISTING HELPERS
  ============================================================ */

  async searchAds(
    query: string,
    filters: any = {},
    page = 1,
    limit = 10,
  ): Promise<{ ads: Ad[]; total: number }> {
    await this.refreshDateDrivenStatuses();

    const skip = (page - 1) * limit;

    const mongoQuery: any = this.buildPublicVisibilityQuery();

    if (filters?.category) mongoQuery.category = filters.category;
    if (filters?.location) mongoQuery.location = filters.location;
    if (typeof filters?.minPrice === 'number') mongoQuery.price = { ...(mongoQuery.price || {}), $gte: filters.minPrice };
    if (typeof filters?.maxPrice === 'number') mongoQuery.price = { ...(mongoQuery.price || {}), $lte: filters.maxPrice };

    if (query && query.trim().length > 0) {
      // Prefer text index when available
      mongoQuery.$text = { $search: query };
    }

    const [ads, total] = await Promise.all([
      this.adModel
        .find(mongoQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.adModel.countDocuments(mongoQuery),
    ]);

    return { ads, total };
  }

  async getNearbyAds(
    lat: number,
    lng: number,
    maxDistance = 10000,
    category?: string,
    page = 1,
    limit = 10,
  ): Promise<{ ads: Ad[]; total: number }> {
    await this.refreshDateDrivenStatuses();

    const skip = (page - 1) * limit;

    const geoQuery: any = this.buildPublicVisibilityQuery();
    if (category) geoQuery.category = category;

    // Try geo query if coordinates are stored
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      geoQuery.locationCoordinates = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: maxDistance,
        },
      } as any;
    }

    const [ads, total] = await Promise.all([
      this.adModel
        .find(geoQuery)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.adModel.countDocuments(geoQuery),
    ]);

    return { ads, total };
  }


  async getAdsByUser(
    userId: string,
    page = 1,
    limit = 10,
    category?: string,
    includeExpired = false,
  ): Promise<{ ads: Ad[]; total: number }> {
    await this.refreshDateDrivenStatuses();

    const skip = (page - 1) * limit;
    const query: any = { userId };
    if (includeExpired) {
      query.status = { $ne: 'deleted' };
    } else {
      Object.assign(query, this.buildPublicVisibilityQuery());
    }
    // Apply category filter if provided
    if (category && category !== 'null') {
      query.category = category;
    }
    const [ads, total] = await Promise.all([
      this.adModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),

      this.adModel.countDocuments(query),
    ]);
    return { ads, total };
  }

  async getUserAnalytics(userId: string): Promise<any> {
    await this.refreshDateDrivenStatuses();

    const ads = await this.adModel
      .find({ userId, status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const normalizedAds = ads.map((ad: any) => {
      const views = Number(ad.cardClicks || ad.views || 0);
      const uniqueVisitors = Number(ad.uniqueVisitors || ad.views || 0);
      const contactClicks = Number(ad.contactClicks || 0);
      const wishlistCount = Number(ad.wishlistSaves || 0);

      const clickThroughRate = views > 0 ? Number(((contactClicks / views) * 100).toFixed(2)) : 0;
      const wishlistRate = views > 0 ? Number(((wishlistCount / views) * 100).toFixed(2)) : 0;

      return {
        ...(ad as any),
        adId: ad.adId || String(ad._id),
        views,
        cardClicks: views,
        uniqueVisitors,
        contactClicks,
        wishlistCount,
        wishlistSaves: wishlistCount,
        clickThroughRate,
        wishlistRate,
        image: Array.isArray(ad.images) && ad.images.length > 0 ? ad.images[0] : null,
      };
    });

    const totals = normalizedAds.reduce(
      (acc: any, ad: any) => {
        acc.totalAds += 1;
        if (ad.status === 'active') acc.activeAds += 1;
        acc.adCardClicks += Number(ad.views || 0);
        acc.uniqueVisitors += Number(ad.uniqueVisitors || 0);
        acc.contactClicks += Number(ad.contactClicks || 0);
        acc.wishlistSaves += Number(ad.wishlistCount || 0);
        return acc;
      },
      {
        totalAds: 0,
        activeAds: 0,
        adCardClicks: 0,
        uniqueVisitors: 0,
        contactClicks: 0,
        wishlistSaves: 0,
      },
    );

    const summary = {
      totalAds: totals.totalAds,
      activeAds: totals.activeAds,
      totalViews: totals.adCardClicks,
      uniqueVisitors: totals.uniqueVisitors,
      totalContactClicks: totals.contactClicks,
      totalWishlistSaves: totals.wishlistSaves,
    };

    const categoryMap = normalizedAds.reduce((acc: any, ad: any) => {
      const category = ad.category || 'Others';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryDistribution = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, population: count }))
      .sort((a, b) => Number(b.population) - Number(a.population));

    const topAdsByViews = [...normalizedAds]
      .sort((a: any, b: any) => Number(b.views || 0) - Number(a.views || 0))
      .slice(0, 5)
      .map((ad: any) => ({
        adId: ad.adId || String(ad._id),
        label: ad.title || ad.category || 'Ad',
        views: Number(ad.views || 0),
      }));

    const adsList = normalizedAds.slice(0, 20).map((ad: any) => ({
      adId: ad.adId || String(ad._id),
      name: ad.title || 'Untitled Ad',
      date: ad.createdAt,
      status: ad.status || 'active',
      category: ad.category || 'Others',
    }));

    return {
      // New common shape used by web and app.
      summary,
      ads: normalizedAds,

      // Backward-compatible shape used by current app screens.
      stats: totals,
      topAdsByViews,
      categoryDistribution,
      adsList,
      updatedAt: new Date().toISOString(),
    };
  }

  async getAdAnalytics(adId: string, userId: string): Promise<any> {
    await this.refreshDateDrivenStatuses();

    const ad = await this.getAdById(adId);

    if (String((ad as any).userId) !== String(userId)) {
      throw new ForbiddenException('You can only view analytics for your own ad');
    }

    const clicks = Number((ad as any).cardClicks || 0);
    const visitors = Number((ad as any).uniqueVisitors || (ad as any).views || 0);
    const contacts = Number((ad as any).contactClicks || 0);
    const wishlist = Number((ad as any).wishlistSaves || 0);

    const ctr = visitors > 0 ? (clicks / visitors) * 100 : 0;
    const visitorsRate = clicks > 0 ? (visitors / clicks) * 100 : 0;
    const wishlistRate = visitors > 0 ? (wishlist / visitors) * 100 : 0;

    return {
      ad: {
        adId: (ad as any).adId || String((ad as any)._id),
        title: (ad as any).title,
        createdAt: (ad as any).createdAt,
        status: (ad as any).status,
        category: (ad as any).category,
      },
      stats: {
        clicks,
        visitors,
        contacts,
        wishlist,
      },
      funnel: {
        adClicks: clicks,
        visitors,
        contacts,
        wishlist,
      },
      rates: {
        ctr,
        visitorsRate,
        wishlistRate,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async getPublicAdAnalytics(adId: string): Promise<any> {
    await this.refreshDateDrivenStatuses();

    const ad = await this.getAdById(adId);

    const clicks = Number((ad as any).cardClicks || 0);
    const visitors = Number((ad as any).uniqueVisitors || (ad as any).views || 0);
    const contacts = Number((ad as any).contactClicks || 0);
    const wishlist = Number((ad as any).wishlistSaves || 0);

    const ctr = visitors > 0 ? (clicks / visitors) * 100 : 0;
    const visitorsRate = clicks > 0 ? (visitors / clicks) * 100 : 0;
    const wishlistRate = visitors > 0 ? (wishlist / visitors) * 100 : 0;

    return {
      ad: {
        adId: (ad as any).adId || String((ad as any)._id),
        title: (ad as any).title,
        createdAt: (ad as any).createdAt,
        status: (ad as any).status,
        category: (ad as any).category,
      },
      stats: {
        clicks,
        visitors,
        contacts,
        wishlist,
      },
      funnel: {
        adClicks: clicks,
        visitors,
        contacts,
        wishlist,
      },
      rates: {
        ctr,
        visitorsRate,
        wishlistRate,
      },
      updatedAt: new Date().toISOString(),
    };
  }


  async getFeaturedDeals(limit = 10): Promise<Ad[]> {
    await this.refreshDateDrivenStatuses();

    const now = new Date();
    const visibilityQuery = this.buildPublicVisibilityQuery();

    return this.adModel
      .find({ ...visibilityQuery, isPromoted: true, promotedUntil: { $gt: now } })
      .sort({ promotedUntil: -1 })
      .limit(limit)
      .exec();
  }

  async getTrendingSearches(limit = 10): Promise<string[]> {
    await this.refreshDateDrivenStatuses();

    const visibilityQuery = this.buildPublicVisibilityQuery();

    // Return top ad titles as trending searches
    const docs = await this.adModel
      .find(visibilityQuery)
      .sort({ views: -1 })
      .limit(limit)
      .select('title')
      .lean()
      .exec();

    // Extract just the titles and remove duplicates
    const titles = [...new Set(docs.map(doc => doc.title).filter(Boolean))];
    return titles.slice(0, limit);
  }

  async getRecommendedDeals(userId: string | undefined, limit = 10): Promise<Ad[]> {
    await this.refreshDateDrivenStatuses();

    const visibilityQuery = this.buildPublicVisibilityQuery();

    // Simple recommendation: if user provided, try same city from user's profile
    if (userId) {
      try {
        const user = await this.userModel.findById(String(userId)).lean().exec();
        const city = user?.profile?.city;
        if (city) {
          return this.adModel
            .find({ ...visibilityQuery, city })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
        }
      } catch (e) {
        this.logger.warn(`Recommendation lookup failed: ${e.message}`);
      }
    }

    // Fallback: most recent active ads
    return this.adModel.find(visibilityQuery).sort({ createdAt: -1 }).limit(limit).exec();
  }

  async getPopularPlaces(limit = 10): Promise<string[]> {
    await this.refreshDateDrivenStatuses();

    const visibilityQuery = this.buildPublicVisibilityQuery();

    const todayStart = visibilityQuery.$or?.[2]?.selectedDates?.$elemMatch?.$gte;
    const todayEnd = visibilityQuery.$or?.[2]?.selectedDates?.$elemMatch?.$lte;

    // Aggregate top cities by ad count and return just city names
    const pipeline = [
      {
        $match: {
          status: 'active',
          city: { $exists: true, $ne: null },
          $or: [
            { selectedDates: { $exists: false } },
            { selectedDates: { $size: 0 } },
            {
              selectedDates: {
                $elemMatch: {
                  $gte: todayStart,
                  $lte: todayEnd,
                },
              },
            },
          ],
        },
      },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 1 } },
    ];

    const results = await (this.adModel as any).aggregate(pipeline).exec();
    return results.map(r => r._id).filter(Boolean);
  }

  async incrementViewCount(adId: string): Promise<void> {
    try {
      const ad = await this.getAdById(adId);
      await this.adModel
        .updateOne(
          { _id: (ad as any)._id },
          { $inc: { views: 1 }, $set: { updatedAt: new Date() } },
        )
        .exec();
    } catch (error: any) {
      this.logger.error(`Failed to increment view count for ${adId}: ${error.message}`);
    }
  }

  async incrementCardClick(adId: string, authHeader?: string): Promise<void> {
    try {
      const ad = await this.getAdById(adId);
      const visitorEmail = await this.extractVisitorEmailFromAuthHeader(authHeader);
      const currentVisitorEmails = Array.isArray((ad as any).visitorEmails) ? (ad as any).visitorEmails : [];
      const normalizedCurrentEmails = currentVisitorEmails
        .filter((email: any) => typeof email === 'string' && email.trim().length > 0)
        .map((email: string) => email.trim().toLowerCase());

      const updateOps: any = {
        $inc: { cardClicks: 1 },
        $set: { updatedAt: new Date() },
      };

      if (visitorEmail && !normalizedCurrentEmails.includes(visitorEmail)) {
        updateOps.$inc.uniqueVisitors = 1;
        updateOps.$addToSet = { visitorEmails: visitorEmail };
      }

      await this.adModel.updateOne({ _id: (ad as any)._id }, updateOps).exec();
    } catch (error: any) {
      this.logger.error(`[ANALYTICS] Failed to increment cardClicks for ${adId}: ${error.message}`, error.stack);
    }
  }

  async incrementContactClick(adId: string): Promise<void> {
    await this.incrementAnalyticsMetric(adId, 'contactClicks');
  }

  async incrementWishlistSave(adId: string): Promise<void> {
    await this.incrementAnalyticsMetric(adId, 'wishlistSaves');
  }

  private async refreshDateDrivenStatuses(): Promise<void> {
    const now = new Date();

    await this.adModel
      .updateMany(
        {
          status: { $nin: ['deleted', 'rejected', 'pending'] },
          expiryDate: { $exists: true, $lt: now },
        },
        { $set: { status: 'expired', updatedAt: now } },
      )
      .exec();

    await this.adModel
      .updateMany(
        {
          status: { $nin: ['deleted', 'rejected', 'pending'] },
          expiryDate: { $exists: true, $gte: now },
        },
        { $set: { status: 'active', updatedAt: now } },
      )
      .exec();
  }

  private getTodayRange(): { start: Date; end: Date } {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  private buildPublicVisibilityQuery(): any {
    const { start, end } = this.getTodayRange();

    return {
      status: 'active',
      $or: [
        { selectedDates: { $exists: false } },
        { selectedDates: { $size: 0 } },
        {
          selectedDates: {
            $elemMatch: {
              $gte: start,
              $lte: end,
            },
          },
        },
      ],
    };
  }

  private async incrementAnalyticsMetric(adId: string, metricField: string): Promise<void> {
    try {
      this.logger.log(`[ANALYTICS] Incrementing ${metricField} for ad: ${adId}`);
      
      const ad = await this.getAdById(adId);
      this.logger.log(`[ANALYTICS] Found ad: ${(ad as any)._id} (adId: ${ad.adId})`);
      
      const result = await this.adModel
        .updateOne(
          { _id: (ad as any)._id },
          { $inc: { [metricField]: 1 }, $set: { updatedAt: new Date() } },
        )
        .exec();
      
      this.logger.log(`[ANALYTICS] Update result for ${metricField}: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
      
      if (result.modifiedCount === 0) {
        this.logger.warn(`[ANALYTICS] WARNING: Update did not modify any documents for ${metricField} on ad ${adId}`);
      }
    } catch (error: any) {
      this.logger.error(`[ANALYTICS] Failed to increment ${metricField} for ${adId}: ${error.message}`, error.stack);
    }
  }

  private async extractVisitorEmailFromAuthHeader(authHeader?: string): Promise<string | null> {
    try {
      if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        return null;
      }

      const token = authHeader.slice(7).trim();
      if (!token) {
        return null;
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        this.logger.warn('[ANALYTICS] JWT_SECRET is not configured, cannot verify visitor token');
        return null;
      }

      const decoded = verify(token, secret) as any;
      const email = typeof decoded?.email === 'string' ? decoded.email.trim().toLowerCase() : '';
      if (!email) {
        return null;
      }

      return email;
    } catch (error: any) {
      this.logger.warn(`[ANALYTICS] Could not decode visitor email from token: ${error.message}`);
      return null;
    }
  }

  /* ============================================================
     UPDATE / DELETE
  ============================================================ */

  async updateAd(
    adId: string,
    userId: string,
    updateData: UpdateAdDto,
  ): Promise<Ad> {
    const ad = await this.getAdById(adId);

    if (ad.userId !== userId) {
      throw new ForbiddenException(
        'You can only update your own ads',
      );
    }

    const updatedAd = await this.adModel
      .findOneAndUpdate(
        { adId },
        { $set: { ...updateData, updatedAt: new Date() } },
        { new: true },
      )
      .exec();

    if (!updatedAd)
      throw new NotFoundException(`Ad ${adId} not found`);

    await this.emitAdUpdated(updatedAd, uuidv4());

    return updatedAd;
  }

  async deleteAd(adId: string, userId: string): Promise<void> {
    const ad = await this.getAdById(adId);

    if (ad.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own ads',
      );
    }

    await this.adModel
      .findOneAndUpdate(
        { adId },
        { status: 'deleted', updatedAt: new Date() },
      )
      .exec();

    await this.emitAdDeleted(adId, userId, uuidv4());
  }

  /* ============================================================
     ✅ SAFE KAFKA EVENTS (PUBLIC NOW)
  ============================================================ */

  async emitAdCreated(ad: Ad, correlationId: string): Promise<void> {
    if (!this.kafkaService) {
      this.logger.warn('Kafka disabled - AD_CREATED skipped');
      return;
    }

    await this.kafkaService.emit(
      KAFKA_TOPICS.AD_CREATED,
      {
        adId: ad.adId,
        userId: ad.userId,
        title: ad.title,
        category: ad.category,
        price: ad.price,
        timestamp: new Date().toISOString(),
      },
      correlationId,
    );
  }

  async emitAdUpdated(ad: Ad, correlationId: string): Promise<void> {
    if (!this.kafkaService) return;

    await this.kafkaService.emit(
      KAFKA_TOPICS.AD_UPDATED,
      {
        adId: ad.adId,
        userId: ad.userId,
        timestamp: new Date().toISOString(),
      },
      correlationId,
    );
  }

  async emitAdDeleted(
    adId: string,
    userId: string,
    correlationId: string,
  ): Promise<void> {
    if (!this.kafkaService) return;

    await this.kafkaService.emit(
      KAFKA_TOPICS.AD_DELETED,
      {
        adId,
        userId,
        timestamp: new Date().toISOString(),
      },
      correlationId,
    );
  }

  /* ============================================================
     VALIDATION
  ============================================================ */

  private validateCategoryData(category: string, data: any): void {
    if (!data) return;
  }
}