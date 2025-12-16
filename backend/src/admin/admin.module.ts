import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { LeadModule } from '../lead/lead.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [ContentModule, LeadModule],
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
