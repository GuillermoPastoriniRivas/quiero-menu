export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailServicePort {
  send(message: EmailMessage): Promise<void>;
}
