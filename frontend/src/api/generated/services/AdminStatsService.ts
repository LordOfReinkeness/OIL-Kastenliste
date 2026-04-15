/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminStatsService {
    /**
     * Full overview of all users, meetings, and scores
     * @returns any Stats list
     * @throws ApiError
     */
    public static adminStatsControllerGetStats(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/stats',
        });
    }
    /**
     * Download stats as CSV or XLSX
     * @param format
     * @param criticalMissing
     * @returns any
     * @throws ApiError
     */
    public static adminStatsControllerExport(
        format?: 'csv' | 'xlsx',
        criticalMissing?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/admin/stats/export',
            query: {
                'format': format,
                'critical_missing': criticalMissing,
            },
        });
    }
}
