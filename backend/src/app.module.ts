import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentModule } from './content/content.module';
import { LeadModule } from './lead/lead.module';
import { AdminModule } from './admin/admin.module';
import { PagesModule } from './pages/pages.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

function getSqlJsConfig(): { wasmBinary: ArrayBuffer } | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sea = require('node:sea');
    if (sea.isSea()) {
      return { wasmBinary: sea.getAsset('sql-wasm.wasm') };
    }
  } catch {
    /* not running as SEA — use default filesystem loading */
  }
  return undefined;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public', 'browser'),
      exclude: ['/api', '/api/{*path}'],
    }),
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: process.env.DB_PATH || 'vezha.sqlite',
      autoSave: true,
      autoLoadEntities: true,
      synchronize: true,
      sqlJsConfig: getSqlJsConfig(),
    }),
    ContentModule,
    LeadModule,
    AdminModule,
    PagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
