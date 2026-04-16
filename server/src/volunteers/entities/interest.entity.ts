import { Entity, Column, ManyToMany, PrimaryColumn } from 'typeorm';
import { Volunteer } from './volunteer.entity';

@Entity()
export class Interest {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ unique: true })
  interest_name!: string;

  @ManyToMany(() => Volunteer, (volunteer) => volunteer.interests)
  volunteers!: Volunteer[];
}
