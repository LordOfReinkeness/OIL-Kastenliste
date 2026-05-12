import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStandupFieldsToUserMeetings1747051200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE user_meetings ADD COLUMN IF NOT EXISTS status_last_week TEXT`);
    await queryRunner.query(`ALTER TABLE user_meetings ADD COLUMN IF NOT EXISTS status_next_week TEXT`);
    await queryRunner.query(`ALTER TABLE user_meetings ADD COLUMN IF NOT EXISTS status_problems TEXT`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE user_meetings DROP COLUMN IF EXISTS status_last_week`);
    await queryRunner.query(`ALTER TABLE user_meetings DROP COLUMN IF EXISTS status_next_week`);
    await queryRunner.query(`ALTER TABLE user_meetings DROP COLUMN IF EXISTS status_problems`);
  }
}
