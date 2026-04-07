import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  linkToken: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column()
  excuseDeadlineMinutes: number;

  @Column({ type: 'timestamptz' })
  checkinDeadline: Date;

  @Column({ type: 'text', nullable: true })
  question: string | null;

  @Column({ type: 'text', nullable: true })
  answer: string | null;

  @Column({ type: 'boolean', nullable: true })
  checkAnswer: boolean | null;

  @Column({ type: 'int', nullable: true })
  maxRetries: number | null;
}
