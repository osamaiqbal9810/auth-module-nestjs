import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { UserIdThrottleGuard, TooManyRequestsException } from './throttleUser.guard';


// Mock the Reflector
const mockReflector = {
    get: jest.fn()
};
const requestStore = new Map<string, { count: number; resetTime: number }>();
describe('UserIdThrottleGuard', () => {
    let guard: UserIdThrottleGuard;
    let context: ExecutionContext;

    // Clear requestStore before each test
    beforeEach(() => {
        requestStore.clear();
        context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: { _id: 'user123' }, // Mock user ID
                    route: { path: '/api/resource' }
                })
            }),
            getHandler: () => {}
        } as unknown as ExecutionContext;
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserIdThrottleGuard,
                { provide: Reflector, useValue: mockReflector }
            ]
        }).compile();

        guard = module.get<UserIdThrottleGuard>(UserIdThrottleGuard);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should allow requests under the limit', async () => {
        mockReflector.get.mockReturnValueOnce(10); // Limit
        mockReflector.get.mockReturnValueOnce(60); // TTL

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
    });

    it('should throttle requests over the limit', async () => {
        mockReflector.get.mockReturnValueOnce(1); // Limit
        mockReflector.get.mockReturnValueOnce(1); // TTL

        // Simulate a request that exceeds the limit
        requestStore.set('user123:/api/resource', { count: 1, resetTime: Date.now() + 1000 });

        await expect(guard.canActivate(context)).rejects.toThrow(TooManyRequestsException);
    });

    it('should reset count after TTL expires', async () => {
        mockReflector.get.mockReturnValueOnce(1); // Limit
        mockReflector.get.mockReturnValueOnce(1); // TTL

        // Simulate a request that exceeds the limit and then reset
        requestStore.set('user123:/api/resource', { count: 1, resetTime: Date.now() - 1000 });

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
        expect(requestStore.get('user123:/api/resource')?.count).toBe(1);
    });

    it('should throw an error if user ID is not found', async () => {
        context.switchToHttp = () => ({
            getRequest: () => ({
                user: {}, // No user ID
                route: { path: '/api/resource' }
            })
        }) as unknown as any;

        await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
    });
});
