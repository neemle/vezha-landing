import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOkResponse({ description: 'API status', schema: { example: { status: 'VEZHA 360 API ready' } } })
  @Get()
  root(): { status: string } {
    return { status: this.appService.getStatus() };
  }

  @ApiOkResponse({
    description: 'Health check',
    schema: { example: { ok: true, status: 'VEZHA 360 API ready' } },
  })
  @Get('health')
  health(): { ok: boolean; status: string } {
    return { ok: true, status: this.appService.getStatus() };
  }
}
