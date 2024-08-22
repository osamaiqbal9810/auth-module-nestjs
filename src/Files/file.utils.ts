
import { extname, join } from 'path';
import { Request } from 'express';
import { AllowedFileTypes } from './file-types.enum';
import { BadRequestException, Injectable, NotAcceptableException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma.service';
import { planProperties, SubscriptionPlan } from 'src/User/enums/SubscriptionPlan.enum';
import { subscriptionLogsToBeFn } from 'rxjs/internal/testing/TestScheduler';

@Injectable()
export class FileUtilsService {
  constructor(private readonly prismaService: PrismaService) {
    FileUtilsHolder.setPrismaService(prismaService); // Set the Prisma in the holder
  }
  static fileNameEditor = (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error, filename: string) => void
  ) => {
    try {
      // Extract the file extension from the original filename
      const fileExtName = extname(file.originalname);
      var guid = randomUUID()
      const newFilename = `${guid}${fileExtName}`;
      callback(null, newFilename);
    } catch (err) {
      return callback(new BadRequestException(new BadRequestException("fileNameEditor Error")), "")
    }
  };

  static fileFilter = async (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error, valid: boolean) => void,
  ) => {
    try {
      const fileExt = extname(file.originalname)
      if (Object.values(AllowedFileTypes).includes(fileExt as AllowedFileTypes)) {
        // storage Quota implementation
        const user = await FileUtilsService.getUserFromRequest(req)
        // Quota Implementation
        let totalUserFilesSize: bigint = BigInt(0);
        user.files.forEach((file) => {
          if (!file.isRemoved) {
            // Ensure fileSize is converted to BigInt if it isn't already
            const fileSize: bigint = BigInt(file.fileSize);
            // Accumulate the file sizes
            totalUserFilesSize += fileSize;
          }
        });
        const userAllowedQuota = planProperties[SubscriptionPlan[user.subscriptionPlan as keyof typeof SubscriptionPlan]]
        if (totalUserFilesSize > userAllowedQuota.quota) {
          return callback(new NotAcceptableException(`Your allowed quota has been overwhelmed. Please upgrade your plan or delete some files to continue using our services.`), false)
        }
        // console.log(`fileSize:`, totalUserFilesSize)
        callback(null, true)
      } else {
        return callback(new BadRequestException(`Only ${Object.keys(AllowedFileTypes).map((type) => `${type}`)} documents are allowed.`), false);
      }
    } catch (err) {
      return callback(new BadRequestException("fileFilter Error"), false);
    }
  }


  static getUserFromRequest = async (request: Request) => {
    const userId = request['user']?._id;
    if (!userId) {
      throw new BadRequestException({ message: "No user found. Invalid authorization token" });
    }
    // Get the prismaService from the holder
    const prismaService = FileUtilsHolder.getPrismaService();
    const user = await prismaService.users.findFirst({
      where: { id: userId, isRemoved: false },
      include: { files: true },
    });

    if (!user) {
      throw new BadRequestException({ message: "No user found" });
    }

    return user
  }
}



export class FileUtilsHolder {
  private static prismaService: PrismaService;

  static setPrismaService(prismaService: PrismaService) {
    FileUtilsHolder.prismaService = prismaService;
  }

  static getPrismaService(): PrismaService {
    if (!FileUtilsHolder.prismaService) {
      throw new Error('UserService has not been initialized.');
    }
    return FileUtilsHolder.prismaService;
  }
}