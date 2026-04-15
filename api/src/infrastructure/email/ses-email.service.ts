import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { EmailServicePort, EmailMessage } from '../../application/ports/email-service.port.js';

@Injectable()
export class SesEmailService implements EmailServicePort {
  private readonly client: SESClient;
  private readonly fromEmail: string;
  private readonly logger = new Logger(SesEmailService.name);

  constructor(config: ConfigService) {
    this.fromEmail = config.get<string>('ses.fromEmail')!;
    this.client = new SESClient({ region: config.get<string>('ses.region')! });
  }

  async send(message: EmailMessage): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: { ToAddresses: [message.to] },
      Message: {
        Subject: { Data: message.subject, Charset: 'UTF-8' },
        Body: { Html: { Data: message.html, Charset: 'UTF-8' } },
      },
    });

    try {
      await this.client.send(command);
      this.logger.log(`Email sent to ${message.to}: ${message.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${message.to}`, error);
      throw error;
    }
  }
}
