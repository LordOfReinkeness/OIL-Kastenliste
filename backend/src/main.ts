import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://oil-kastenliste.lukas-reinke.de',
    ],
    credentials: true,
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'dev-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.COOKIE_SECURE === 'true' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
