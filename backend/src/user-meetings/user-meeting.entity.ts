import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Meeting } from '../meetings/meeting.entity';
import { User } from '../users/user.entity';

export enum ExcuseType {
  LATE = 'late',
  ABSENT = 'absent',
}

@Entity('user_meetings')
export class UserMeeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Meeting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @Column()
  meetingId: string;

  @Column({ type: 'timestamptz', nullable: true })
  excusedAt: Date | null;

  @Column({ type: 'enum', enum: ExcuseType, nullable: true })
  excuseType: ExcuseType | null;

  @Column({ type: 'timestamptz', nullable: true })
  liveCheckedInAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  postCheckedInAt: Date | null;

  @Column({ type: 'boolean', nullable: true })
  isLate: boolean | null;

  @Column({ type: 'text', nullable: true })
  attendanceType: 'in_person' | 'remote' | null;

  @Column({ type: 'boolean', nullable: true })
  answerCorrect: boolean | null;

  @Column({ type: 'int', default: 0 })
  answerAttempts: number;

  @Column({ type: 'int', default: 0 })
  infractions: number;

  @Column({ type: 'text', nullable: true })
  statusLastWeek: string | null;

  @Column({ type: 'text', nullable: true })
  statusNextWeek: string | null;

  @Column({ type: 'text', nullable: true })
  statusProblems: string | null;
}
