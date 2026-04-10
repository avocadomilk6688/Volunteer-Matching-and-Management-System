import { Entity, Column, PrimaryColumn, OneToOne } from 'typeorm';
import { Programme } from './programme.entity';

@Entity()
export class Schedule {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ type: 'datetime' })
  start_time!: Date;

  @Column({ type: 'datetime' })
  end_time!: Date;

//   @OneToOne(() => Programme, (programme) => programme.schedule)
//   programme!: Programme;
}
