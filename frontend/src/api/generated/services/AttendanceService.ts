/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdateAttendanceDto } from '../models/UpdateAttendanceDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AttendanceService {
    /**
     * Get attendance for all users
     * @param id
     * @returns any Meeting with attendance list
     * @throws ApiError
     */
    public static attendanceControllerGetAttendance(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/meetings/{id}/attendance',
            path: {
                'id': id,
            },
            errors: {
                404: `Meeting not found`,
            },
        });
    }
    /**
     * Override attendance for a user
     * @param id
     * @param userId
     * @param requestBody
     * @returns any Updated attendance record
     * @throws ApiError
     */
    public static attendanceControllerPatchAttendance(
        id: string,
        userId: string,
        requestBody: UpdateAttendanceDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/meetings/{id}/attendance/{userId}',
            path: {
                'id': id,
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Meeting or user not found`,
            },
        });
    }
}
