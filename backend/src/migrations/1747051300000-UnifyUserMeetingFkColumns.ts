import { MigrationInterface, QueryRunner } from 'typeorm';

export class UnifyUserMeetingFkColumns1747051300000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Remove rows whose varchar IDs no longer reference existing records
    await queryRunner.query(`
      DELETE FROM user_meetings
      WHERE "userId"    NOT IN (SELECT id::text FROM users)
         OR "meetingId" NOT IN (SELECT id::text FROM meetings)
    `);

    // Backfill the UUID FK columns from the old varchar columns
    await queryRunner.query(`
      UPDATE user_meetings
      SET user_id    = "userId"::uuid,
          meeting_id = "meetingId"::uuid
      WHERE user_id IS NULL OR meeting_id IS NULL
    `);

    await queryRunner.query(`ALTER TABLE user_meetings ALTER COLUMN user_id    SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE user_meetings ALTER COLUMN meeting_id SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE user_meetings DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE user_meetings DROP COLUMN "meetingId"`);

    await queryRunner.query(`
      ALTER TABLE user_meetings
      ADD CONSTRAINT "UQ_user_meetings_user_id_meeting_id" UNIQUE (user_id, meeting_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_meetings
      DROP CONSTRAINT "UQ_user_meetings_user_id_meeting_id"
    `);

    await queryRunner.query(`ALTER TABLE user_meetings ADD COLUMN "userId"    character varying`);
    await queryRunner.query(`ALTER TABLE user_meetings ADD COLUMN "meetingId" character varying`);

    await queryRunner.query(`
      UPDATE user_meetings
      SET "userId"    = user_id::text,
          "meetingId" = meeting_id::text
    `);

    await queryRunner.query(`ALTER TABLE user_meetings ALTER COLUMN "userId"    SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE user_meetings ALTER COLUMN "meetingId" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE user_meetings ALTER COLUMN user_id    DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE user_meetings ALTER COLUMN meeting_id DROP NOT NULL`);
  }
}
