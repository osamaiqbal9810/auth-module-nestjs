import { Injectable } from '@nestjs/common';
import { join } from 'path';

@Injectable()
export class AppService {
  getHello(): string {
    console.log(join(process.cwd(), 'uploads'))
    return 'Hello World!';
  }
}
