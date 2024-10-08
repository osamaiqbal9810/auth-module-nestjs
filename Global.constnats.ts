import { SetMetadata } from "@nestjs/common"

export const FILE_SIZE = 1000 * 1000 * 10 // 10MB

export const BASIC_PLAN_FILES_SIZE_LIMIT = 1000 * 1000 * 100 // 100 MB
export const STANDARD_PLAN_FILES_SIZE_LIMIT = 1000 * 1000 * 1000 // 1 GB
export const PREMIUM_PLAN_FILES_SIZE_LIMIT = 1000 * 1000 * 10000 // 10 GB


export const FILE_UPLOAD_DIR = "uploads"


export const THROTTLE_LIMIT_KEY = 'throttle_limit';
export const THROTTLE_TTL_KEY = 'throttle_ttl';
export const Throttle_Limit = (limit: number) => SetMetadata(THROTTLE_LIMIT_KEY, limit);
export const Throttle_Ttl = (ttl: number) => SetMetadata(THROTTLE_TTL_KEY, ttl);