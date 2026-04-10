import { Entity, Column, ManyToMany, PrimaryColumn } from 'typeorm';
import { Volunteer } from './volunteer.entity';

@Entity()
export class Skill {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ unique: true })
  skill_name!: string;

  @ManyToMany(() => Volunteer, (volunteer) => volunteer.skills)
  volunteers!: Volunteer[];
}
