/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ExcuseDto = {
    rzId: string;
    excuseType: ExcuseDto.excuseType;
    /**
     * Required when excuseType is absent
     */
    statusLastWeek?: string;
    /**
     * Required when excuseType is absent
     */
    statusNextWeek?: string;
    statusProblems?: string;
};
export namespace ExcuseDto {
    export enum excuseType {
        LATE = 'late',
        ABSENT = 'absent',
    }
}

