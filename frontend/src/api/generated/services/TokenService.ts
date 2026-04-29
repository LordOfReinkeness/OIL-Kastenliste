/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LiveCheckinDto } from '../models/LiveCheckinDto';
import type { PostCheckinDto } from '../models/PostCheckinDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TokenService {
    /**
     * Get meeting info by check-in token
     * @param token
     * @returns any Meeting found
     * @throws ApiError
     */
    public static tokenControllerGetMeeting(
        token: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/meetings/t/{token}',
            path: {
                'token': token,
            },
            errors: {
                404: `Meeting not found`,
            },
        });
    }
    /**
     * Check in during the meeting
     * @param token
     * @param requestBody
     * @returns any Checked in
     * @throws ApiError
     */
    public static tokenControllerLiveCheckIn(
        token: string,
        requestBody: LiveCheckinDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/meetings/t/{token}/live-checkin',
            path: {
                'token': token,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Live check-in window not open`,
                404: `User or meeting not found`,
                409: `Already checked in`,
            },
        });
    }
    /**
     * Post-meeting check-in before closing deadline
     * @param token
     * @param requestBody
     * @returns any Checked in or wrong answer
     * @throws ApiError
     */
    public static tokenControllerPostCheckIn(
        token: string,
        requestBody: PostCheckinDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/meetings/t/{token}/post-checkin',
            path: {
                'token': token,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Deadline passed or max retries reached`,
                404: `User or meeting not found`,
                409: `Already checked in or already checked in live`,
            },
        });
    }
}
