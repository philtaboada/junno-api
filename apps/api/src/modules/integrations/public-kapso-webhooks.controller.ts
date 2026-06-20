import { Body, Controller, Post } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

@Controller('public/integrations/kapso')
export class PublicKapsoWebhooksController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('webhooks')
  async receiveWebhook(@Body() payload: unknown): Promise<{ readonly ok: true }> {
    await this.integrationsService.logKapsoInboundWebhook(payload);
    return { ok: true };
  }
}
