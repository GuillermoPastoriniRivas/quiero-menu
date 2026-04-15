export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly name: string,
    public readonly emailVerified: boolean,
    public readonly createdAt: Date,
  ) {}
}
