import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Volunteer } from './volunteer.entity';

@Entity()
@Unique(['volunteer', 'month', 'year'])
export class VolunteerMonthlyPoint {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Volunteer)
  volunteer!: Volunteer;

  @Column()
  month!: number;

  @Column()
  year!: number;

  @Column({ type: 'double', default: 0 })
  totalHours!: number; // Sum of hours contributed this month

  @Column({ type: 'double', default: 0 })
  points!: number; // Calculated as (Hours * Rating at time of completion)
}
