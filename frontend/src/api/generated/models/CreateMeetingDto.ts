/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateMeetingDto = {
    date: string;
    excuseDeadlineMinutes: number;
    checkinDeadline: string;
    checkinWindowMinutes?: number;
    capInfractions?: boolean;
    question?: string;
    answer?: string;
    checkAnswer?: boolean;
    maxRetries?: number;
};

