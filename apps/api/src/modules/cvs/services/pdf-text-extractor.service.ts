import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class PdfTextExtractor {
  async extractFromFile(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    return this.extractFromBuffer(buffer);
  }

  async extractFromBuffer(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }
}
