import * as dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Finance Tracker Backend running on port ${port}`);
}

bootstrap();
