import { Entity, Column, PrimaryColumn, OneToOne } from 'typeorm';
import { Volunteer } from '../../volunteers/entities/volunteer.entity';
import { Admin } from './admin.entity';

@Entity()
export class User {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ nullable: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'volunteer', 'organization'],
    default: 'volunteer',
  })
  role!: string;

  @OneToOne(() => Volunteer, (volunteer) => volunteer.user)
  volunteer?: Volunteer;

  @OneToOne(() => Admin, (admin) => admin.user)
  admin?: Admin;
}
