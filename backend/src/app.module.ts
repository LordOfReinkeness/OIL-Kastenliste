import { join } from 'path';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { MeetingsModule } from './meetings/meetings.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
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
