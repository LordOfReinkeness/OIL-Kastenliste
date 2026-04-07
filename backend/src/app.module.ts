import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { MeetingsModule } from './meetings/meetings.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
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
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    HealthModule,
    UsersModule,
    MeetingsModule,
    AdminModule,
  ],
})
export class AppModule {}
