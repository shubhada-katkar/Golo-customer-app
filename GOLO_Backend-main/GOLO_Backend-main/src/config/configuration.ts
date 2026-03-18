import { registerAs } from '@nestjs/config';

const parseBoolean = (value?: string): boolean => {
  if (!value) return false;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const parseList = (value?: string): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};


export default registerAs('config', () => {
  // NOTE: dotenv will load the file specified by envFilePath in ConfigModule
  // without extra logging.  Diagnostics were removed after confirming .env
  // is being read correctly.

  return {
    environment: process.env.NODE_ENV || 'development',

    service: {
      name: process.env.SERVICE_NAME || 'ads-service',
      port: parseInt(process.env.PORT, 10) || 3002,
    },

    cors: {
      origins: parseList(process.env.CORS_ORIGINS),
    },

    mongodb: {
      // 🔴 Make sure URI is required in production
      uri: process.env.MONGODB_URI,
    },

    kafka: {
      enabled: parseBoolean(process.env.ENABLE_KAFKA ?? 'false'),
      brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : [],
      clientId: process.env.KAFKA_CLIENT_ID || 'golo-backend',
      groupId: process.env.KAFKA_GROUP_ID || 'golo-consumer-group',
      sasl: process.env.KAFKA_SASL_USERNAME ? {
        mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD,
      } : undefined,
      ssl: false,
    },

    // 🔴 ADDED: JWT configuration (important for Railway)
    jwt: {
      secret: process.env.JWT_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_EXPIRATION || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },

    cloudinary: {
      url: process.env.CLOUDINARY_URL,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      uploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'golo/ads',
    },

    share: {
      appScheme: process.env.APP_DEEP_LINK_SCHEME || 'golo',
      webBaseUrl: process.env.AD_SHARE_WEB_BASE_URL || '',
    },

    email: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
      from: process.env.EMAIL_FROM || process.env.EMAIL,
    },
  };
});