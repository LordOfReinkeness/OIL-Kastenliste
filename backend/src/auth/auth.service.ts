import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private readonly config: ConfigService) {}

  validatePassword(password: string): boolean {
    const adminPassword = this.config.getOrThrow<string>('ADMIN_PASSWORD');
    return password === adminPassword;
  }
}
