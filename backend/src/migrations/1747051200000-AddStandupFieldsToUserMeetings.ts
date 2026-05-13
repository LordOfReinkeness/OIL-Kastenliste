import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStandupFieldsToUserMeetings1747051200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE user_meetings ADD COLUMN IF NOT EXISTS "statusLastWeek" TEXT`);
    await queryRunner.query(`ALTER TABLE user_meetings ADD COLUMN IF NOT EXISTS "statusNextWeek" TEXT`);
    await queryRunner.query(`ALTER TABLE user_meetings ADD COLUMN IF NOT EXISTS "statusProblems" TEXT`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE user_meetings DROP COLUMN IF EXISTS "statusLastWeek"`);
    await queryRunner.query(`ALTER TABLE user_meetings DROP COLUMN IF EXISTS "statusNextWeek"`);
    await queryRunner.query(`ALTER TABLE user_meetings DROP COLUMN IF EXISTS "statusProblems"`);
  }
}
