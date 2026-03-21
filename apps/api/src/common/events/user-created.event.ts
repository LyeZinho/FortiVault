export class UserCreatedEvent {
  constructor(
    public userId: string,
    public email: string,
    public activationToken: string,
    public activationUrl: string,
  ) {}
}
