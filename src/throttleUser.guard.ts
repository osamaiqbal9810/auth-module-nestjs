import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { THROTTLE_LIMIT_KEY, THROTTLE_TTL_KEY } from '../Global.constnats';

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * In-memory store for tracking request counts and reset times for rate limiting.
 * 
 * This `Map` stores information about the number of requests made by a specific user
 * (or IP, depending on the implementation) to a particular route within a given time window.
 * The key of the map is a combination of the user identifier and route path, ensuring
 * that request tracking is done on a per-user-per-route basis.
 * 
 * Each entry in the map contains:
 * - `count`: The number of requests made by the user to the route within the current time window.
 * - `resetTime`: The timestamp (in milliseconds since the Unix epoch) when the rate limit counter will be reset.
 * 
 * The `requestStore` is used to enforce rate limiting by checking the number of requests made
 * against the defined limit and determining if the rate limit window has expired. If the request
 * count exceeds the limit, the store will check the `resetTime` to determine if the rate limit
 * window has expired and whether to reset the counter or continue throttling.
 * 
 * Example of a `requestStore` entry:
 * - Key: 'user123:/api/resource'
 * - Value: { count: 5, resetTime: 1696009200000 }
 * 
 * In this example, 'user123' has made 5 requests to '/api/resource', and the rate limit
 * will reset at the timestamp 1696009200000 (in milliseconds).
 */
const requestStore = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class UserIdThrottleGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const handler = context.getHandler();

        // Fetch custom limit and TTL from metadata
        const limit = this.reflector.get<number>(THROTTLE_LIMIT_KEY, handler) || 10; // Default limit
        const ttl = this.reflector.get<number>(THROTTLE_TTL_KEY, handler) || 60; // Default TTL

        // Extract user ID from the request (assumed to be available)
    
        const userId = req.user?._id; // Adjust this according to where the user ID is stored in the request
        if (!userId) {
            throw new BadRequestException('User ID not found in request');
        }
        // Generate a unique key for tracking requests based on user ID and route
        const key = `${userId}:${req.route.path}`;

        // Retrieve the tracker from the in-memory store
        let tracker = requestStore.get(key) || { count: 0, resetTime: Date.now() + ttl * 1000 };

        // Check request count and enforce throttling
        if (tracker.count >= limit) {
            const timeLeft = tracker.resetTime - Date.now();
            if (timeLeft > 0) {
                throw new TooManyRequestsException(`Rate limit exceeded. Try again in ${Math.ceil(timeLeft / 1000)} seconds.`);
            } else {
                // TTL expired, reset the tracker
                tracker.count = 0;
                tracker.resetTime = Date.now() + ttl * 1000;
            }
        } else {
            if (!tracker.resetTime) {
                tracker.resetTime = Date.now() + ttl * 1000;
            }
        }

        // Update tracker and store it back in memory
        tracker.count++;
        requestStore.set(key, tracker);

        return true; // Request is allowed
    }
}



export class TooManyRequestsException extends HttpException {
    constructor(message: string = 'Too many requests') {
        super(message, HttpStatus.TOO_MANY_REQUESTS);
    }
}