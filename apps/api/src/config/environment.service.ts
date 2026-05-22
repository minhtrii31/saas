import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvironmentService {
  constructor() {
    this.require('JWT_SECRET');
  }

  private require(name: string): string {
    const value = process.env[name];

    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${name} is required`);
    }

    return value;
  }
}
