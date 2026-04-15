/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateAttendanceDto = {
    liveCheckedInAt?: string | null;
    postCheckedInAt?: string | null;
    isLate?: boolean | null;
    attendanceType?: UpdateAttendanceDto.attendanceType | null;
    answerCorrect?: boolean | null;
    excusedAt?: string | null;
    excuseType?: UpdateAttendanceDto.excuseType | null;
};
export namespace UpdateAttendanceDto {
    export enum attendanceType {
        IN_PERSON = 'in_person',
        REMOTE = 'remote',
    }
    export enum excuseType {
        LATE = 'late',
        ABSENT = 'absent',
    }
}

