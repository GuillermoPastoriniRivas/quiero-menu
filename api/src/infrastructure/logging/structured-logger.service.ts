import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';

export const LOG_LEVELS: Record<string, LogLevel[]> = {
  error: ['error'],
  warn: ['error', 'warn'],
  info: ['error', 'warn', 'log'],
  debug: ['error', 'warn', 'log', 'debug'],
  verbose: ['error', 'warn', 'log', 'debug', 'verbose'],
};

export function parseLogLevels(raw?: string): LogLevel[] {
  const level = (raw ?? 'info').toLowerCase();
  return LOG_LEVELS[level] ?? LOG_LEVELS.info;
}

@Injectable()
export class StructuredLogger extends ConsoleLogger {
  private readonly jsonMode: boolean;

  constructor() {
    super();
    this.setLogLevels(parseLogLevels(process.env.LOG_LEVEL));
    this.jsonMode = process.env.NODE_ENV === 'production';
  }

  protected printMessages(
    messages: unknown[],
    context?: string,
    logLevel?: LogLevel,
    writeStreamType?: 'stdout' | 'stderr',
  ): void {
    const stream =
      writeStreamType === 'stderr' ? process.stderr : process.stdout;
    for (const message of messages) {
      const line = this.jsonMode
        ? JSON.stringify({
            level: logLevel ?? 'log',
            message:
              typeof message === 'string' ? message : JSON.stringify(message),
            context,
            timestamp: new Date().toISOString(),
          })
        : `[${logLevel ?? 'log'}] ${String(message)}`;
      stream.write(`${line}\n`);
    }
  }
}
