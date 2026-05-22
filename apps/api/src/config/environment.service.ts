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

  optional(name: string, defaultValue?: string): string {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return '';
  }

  optionalInt(name: string, defaultValue: number): number {
    const value = this.optional(name);
    if (!value) {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
}
