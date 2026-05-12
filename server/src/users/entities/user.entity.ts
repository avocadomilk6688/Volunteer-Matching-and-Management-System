import { Entity, Column, PrimaryColumn, OneToOne } from 'typeorm';
import { Volunteer } from '../../volunteers/entities/volunteer.entity';
import { Admin } from './admin.entity';
import { Organization } from '../../organizations/entities/organization.entity'; // Import this!

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

  @OneToOne(() => Volunteer, (volunteer) => volunteer.user, { eager: true })
  volunteer?: Volunteer;

  @OneToOne(() => Admin, (admin) => admin.user, { eager: true })
  admin?: Admin;

  @OneToOne(() => Organization, (organization) => organization.user, {
    eager: true,
  })
  organization?: Organization;
}
