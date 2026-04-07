import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  rzId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;
}
