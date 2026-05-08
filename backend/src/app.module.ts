import { join } from 'path';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { config } from './config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { MeetingsModule } from './meetings/meetings.module';
import { UsersModule } from './users/users.module';
import { AdminAwareThrottlerGuard } from './auth/throttle.guard';

// Baked-in at image build time via ARG DISABLE_THROTTLE (defaults to off = throttling on).
// In dev, THROTTLE_ENABLED=false in .env also disables it — but only outside production.
const THROTTLE_ON =
  process.env.DISABLE_THROTTLE !== 'true' &&
  !(process.env.NODE_ENV !== 'production' && process.env.THROTTLE_ENABLED === 'false');

@Module({
  imports: [
    ...(THROTTLE_ON
      ? [ThrottlerModule.forRoot([
          { name: 'default', ttl: config.rateLimit.defaultTtlMs, limit: config.rateLimit.defaultLimit },
          { name: 'write',   ttl: config.rateLimit.writeTtlMs,   limit: config.rateLimit.writeLimit },
        ])]
      : []),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'frontend-dist'),
      exclude: ['/api/*path'],
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.getOrThrow('DB_USER'),
        password: config.getOrThrow('DB_PASSWORD'),
        database: config.getOrThrow('DB_NAME'),
        autoLoadEntities: true,
        synchronize: config.get('DB_SYNCHRONIZE') === 'true',
      }),
    }),
    AuthModule,
    HealthModule,
    UsersModule,
    MeetingsModule,
    AdminModule,
  ],
  providers: [
    ...(THROTTLE_ON ? [{ provide: APP_GUARD, useClass: AdminAwareThrottlerGuard }] : []),
  ],
})
export class AppModule implements NestModule {
  private readonly logger = new Logger('HTTP');

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: () => void) => {
        const { method, originalUrl } = req;
        const start = Date.now();
        res.on('finish', () => {
          const ms = Date.now() - start;
          this.logger.log(`${method} ${originalUrl} ${res.statusCode} +${ms}ms`);
        });
        next();
      })
      .forRoutes('*');
  }
}
