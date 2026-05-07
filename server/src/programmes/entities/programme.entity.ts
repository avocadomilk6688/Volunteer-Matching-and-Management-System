import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Schedule } from './schedule.entity';
import { Skill } from '../../volunteers/entities/skill.entity';
import { Interest } from '../../volunteers/entities/interest.entity';
import { Application } from '../../applications/entities/application.entity';
import { Volunteer } from '../../volunteers/entities/volunteer.entity';

@Entity()
export class Programme {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ nullable: true })
  imageUrl!: string;

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

  @OneToMany(() => Application, (application) => application.programme)
  applications!: Application[];

  /**
   * FIXED: Added explicit joinColumn and inverseJoinColumn mapping.
   * joinColumn = This Entity (Programme) -> programmeId
   * inverseJoinColumn = The Other Entity (Volunteer) -> volunteerId
   */
  @ManyToMany(() => Volunteer, (volunteer) => volunteer.saved_programmes)
  @JoinTable({
    name: 'saved_programmes',
    joinColumn: {
      name: 'programmeId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'volunteerId',
      referencedColumnName: 'id',
    },
  })
  saved_by!: Volunteer[];
}
