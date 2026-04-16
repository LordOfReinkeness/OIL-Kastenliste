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

  @Column({ type: 'int', default: 60 })
  checkinWindowMinutes: number;

  @Column({ type: 'boolean', default: true })
  liveCheckinOpen: boolean;

  @Column({ type: 'boolean', default: false })
  capInfractions: boolean;

  @Column({ type: 'text', nullable: true })
  question: string | null;

  @Column({ type: 'text', nullable: true })
  answer: string | null;

  @Column({ type: 'boolean', default: true })
  checkAnswer: boolean;

  @Column({ type: 'int', default: 3 })
  maxRetries: number;
}
