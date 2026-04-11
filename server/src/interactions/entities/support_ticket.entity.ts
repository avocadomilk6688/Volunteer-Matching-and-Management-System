import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class SupportTicket {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ default: 'open' })
  status!: string;

  @ManyToOne(() => User)
  user!: User;

  @CreateDateColumn()
  submissionTime!: Date;
}
