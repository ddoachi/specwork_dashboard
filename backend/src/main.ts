import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Specwork Dashboard API')
    .setDescription('Dashboard API for project specifications management')
    .setVersion('1.0')
    .addTag('dashboard')
    .addTag('specs')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  console.log('PORT: ', process.env.PORT);
  console.log('DATABASE_URL =', process.env.DATABASE_URL);
  console.log('Swagger UI available at: http://localhost:' + (process.env.PORT ?? 3000) + '/api');
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
