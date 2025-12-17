import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminPageCategoriesController } from './admin-page-categories.controller';
import { AdminPagesController } from './admin-pages.controller';
import { PageCategoryEntity } from './page-category.entity';
import { PageCategoryTranslationEntity } from './page-category-translation.entity';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { StaticPageEntity } from './static-page.entity';
import { StaticPageTranslationEntity } from './static-page-translation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PageCategoryEntity,
      PageCategoryTranslationEntity,
      StaticPageEntity,
      StaticPageTranslationEntity,
    ]),
  ],
  controllers: [PagesController, AdminPageCategoriesController, AdminPagesController],
  providers: [PagesService],
})
export class PagesModule {}

