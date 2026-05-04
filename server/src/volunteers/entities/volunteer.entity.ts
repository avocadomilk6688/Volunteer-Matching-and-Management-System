import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Skill } from './skill.entity';
import { Interest } from './interest.entity';
import { Application } from '../../applications/entities/application.entity';

@Entity()
export class Volunteer {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ name: 'profile_picture_url', nullable: true })
  profile_picture_url!: string;

  @Column({ type: 'char', length: 1, nullable: true })
  gender!: string;

  @Column({ name: 'contact_number', nullable: true })
  contact_number!: string;

  @Column({ nullable: true })
  location!: string;

  @ManyToMany(() => Skill, (skill) => skill.volunteers)
  @JoinTable({ name: 'volunteer_skills' }) // Explicit naming is safer for ManyToMany
  skills!: Skill[];

  @ManyToMany(() => Interest, (interest) => interest.volunteers)
  @JoinTable({ name: 'volunteer_interests' })
  interests!: Interest[];

  @Column({ default: 0 })
  points!: number;

  @Column({ type: 'double', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column({ name: 'resume_url', nullable: true })
  resume_url!: string;

  @OneToOne(() => User, (user) => user.volunteer, {
    cascade: ['update'],
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id' })
  user!: User;

  @OneToMany(() => Application, (application) => application.volunteer)
  applications!: Application[];
}
