/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateMeetingDto } from '../models/CreateMeetingDto';
import type { ExcuseDto } from '../models/ExcuseDto';
import type { UpdateMeetingDto } from '../models/UpdateMeetingDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MeetingsService {
    /**
     * Create a new meeting
     * @param requestBody
     * @returns any Meeting created
     * @throws ApiError
     */
    public static meetingsControllerCreate(
        requestBody: CreateMeetingDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/meetings',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List all meetings
     * @returns any List of meetings
     * @throws ApiError
     */
    public static meetingsControllerFindAll(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/meetings',
        });
    }
    /**
     * Get next upcoming meeting
     * @returns any Next meeting
     * @throws ApiError
     */
    public static meetingsControllerFindNext(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/meetings/next',
            errors: {
                404: `No upcoming meeting`,
            },
        });
    }
    /**
     * Submit an excuse for the next upcoming meeting
     * @param requestBody
     * @returns any Excuse submitted
     * @throws ApiError
     */
    public static meetingsControllerExcuseNextMeeting(
        requestBody: ExcuseDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/meetings/next/excuse',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `No upcoming meeting or user not found`,
            },
        });
    }
    /**
     * Get a meeting by UUID
     * @param id
     * @returns any Meeting found
     * @throws ApiError
     */
    public static meetingsControllerFindOne(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/meetings/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Meeting not found`,
            },
        });
    }
    /**
     * Update a meeting
     * @param id
     * @param requestBody
     * @returns any Meeting updated
     * @throws ApiError
     */
    public static meetingsControllerUpdate(
        id: string,
        requestBody: UpdateMeetingDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/meetings/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Meeting not found`,
            },
        });
    }
    /**
     * Delete a meeting
     * @param id
     * @returns any Meeting deleted
     * @throws ApiError
     */
    public static meetingsControllerRemove(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/meetings/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Meeting not found`,
            },
        });
    }
}
