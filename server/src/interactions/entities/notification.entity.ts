import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Notification {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @ManyToOne(() => User)
  receiver!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
