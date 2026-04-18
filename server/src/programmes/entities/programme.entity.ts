import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Schedule } from './schedule.entity';
import { Skill } from '../../volunteers/entities/skill.entity';
import { Interest } from '../../volunteers/entities/interest.entity'; // Assuming you have/will create this
import { Volunteer } from '../../volunteers/entities/volunteer.entity';

@Entity()
export class Programme {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @ManyToOne(() => Organization)
  organization!: Organization;

  @OneToOne(() => Schedule, (schedule) => schedule.programme, {
    cascade: true,
  })
  @JoinColumn()
  schedule!: Schedule;

  @ManyToMany(() => Skill)
  @JoinTable({ name: 'programme_skills' })
  related_skills!: Skill[];

  @ManyToMany(() => Interest)
  @JoinTable({ name: 'programme_interests' })
  related_interests!: Interest[];

  @ManyToMany(() => Volunteer, (volunteer) => volunteer.programmes)
  @JoinTable({ name: 'programme_participants' })
  participants!: Volunteer[];
}
