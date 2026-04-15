/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LiveCheckinDto = {
    rzId: string;
    attendanceType: LiveCheckinDto.attendanceType;
};
export namespace LiveCheckinDto {
    export enum attendanceType {
        IN_PERSON = 'in_person',
        REMOTE = 'remote',
    }
}

