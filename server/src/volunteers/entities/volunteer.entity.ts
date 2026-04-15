import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
  ManyToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Programme } from '../../programmes/entities/programme.entity';

@Entity()
export class Volunteer {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ nullable: true })
  profilePictureUrl!: string;

  @Column({ type: 'char', length: 1 })
  gender!: string;

  @Column()
  contactNumber!: string;

  @Column()
  location!: string;

  @Column('simple-array', { nullable: true })
  skills!: string[];

  @Column('simple-array', { nullable: true })
  interests!: string[];

  @Column()
  participant_score!: number;

  @Column({ type: 'double', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'id' })
  user!: User;

  @ManyToMany(() => Programme, (programme) => programme.participants)
  programmes!: Programme[];
}
