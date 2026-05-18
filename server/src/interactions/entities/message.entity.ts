import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Programme } from '../../programmes/entities/programme.entity';

@Entity()
export class Message {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @ManyToOne(() => User)
  sender!: User;

  @ManyToOne(() => User)
  receiver!: User;

  @ManyToOne(() => Programme, { nullable: true })
  programme!: Programme;

  @CreateDateColumn()
  timestamp!: Date;
}
