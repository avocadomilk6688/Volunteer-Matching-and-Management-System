import { Entity, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { Volunteer } from '../../volunteers/entities/volunteer.entity';
import { Programme } from '../../programmes/entities/programme.entity';

@Entity()
export class Application {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ type: 'datetime' })
  applied_at!: Date;

  @Column({ type: 'text', nullable: true })
  volunteer_message!: string;
  @ManyToOne(() => Volunteer, (volunteer) => volunteer.applications)
  volunteer!: Volunteer;

  @ManyToOne(() => Programme, (programme) => programme.applications)
  programme!: Programme;
}
