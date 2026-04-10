import { Entity, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Rating {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ type: 'double', precision: 3, scale: 2 })
  value!: number;

  @ManyToOne(() => User)
  rater!: User;

  @ManyToOne(() => User)
  ratee!: User;
}
