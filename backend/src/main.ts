import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', true);
  app.enableCors({ origin: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: false,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('VEZHA 360 API')
      .setDescription('Landing content and lead capture API')
      .setVersion('1.0.0')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-admin-token',
          in: 'header',
          description: 'Admin token required for /admin endpoints',
        },
        'x-admin-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
