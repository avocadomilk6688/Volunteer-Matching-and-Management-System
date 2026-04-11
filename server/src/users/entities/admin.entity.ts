import { Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Admin {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;
}
