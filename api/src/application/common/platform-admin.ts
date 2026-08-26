export function isPlatformAdminEmail(
  email: string,
  adminEmails: string[],
): boolean {
  return adminEmails.includes(email.toLowerCase());
}
