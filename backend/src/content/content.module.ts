import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandingContentEntity } from './landing-content.entity';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { LibreTranslateService } from './libre-translate.service';

@Module({
  imports: [TypeOrmModule.forFeature([LandingContentEntity])],
  controllers: [ContentController],
  providers: [ContentService, LibreTranslateService],
  exports: [ContentService],
})
export class ContentModule {}
