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

  @Column({ nullable: true })
  profilePictureUrl!: string;

  @Column({ type: 'char', length: 1, nullable: true })
  gender!: string;

  @Column({ nullable: true })
  contactNumber!: string;

  @Column({ nullable: true })
  location!: string;

  @ManyToMany(() => Skill, (skill) => skill.volunteers)
  @JoinTable()
  skills!: Skill[];

  @ManyToMany(() => Interest, (interest) => interest.volunteers)
  @JoinTable()
  interests!: Interest[];

  @Column({ nullable: true })
  participant_score!: number;

  @Column({
    type: 'double',
    precision: 3,
    scale: 2,
    default: 0,
    nullable: true,
  })
  rating!: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'id' })
  user!: User;

  @OneToMany(() => Application, (application) => application.volunteer)
  applications!: Application[];
}
