import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Programme } from '../../programmes/entities/programme.entity';

@Entity('rating')
export class Rating {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ type: 'double', precision: 3, scale: 2 })
  value!: number;

  @ManyToOne(() => User)
  rater!: User;

  @ManyToOne(() => User)
  ratee!: User;

  @ManyToOne(() => Programme)
  @JoinColumn({ name: 'programmeId' })
  programme!: Programme;
}
