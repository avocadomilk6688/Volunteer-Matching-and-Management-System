import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrganizationRegistration } from './organization-registration.entity';

@Entity()
export class Organization {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ type: 'double', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column()
  profile_picture_url!: string;

  @Column()
  contact_number!: string;

  @OneToOne(() => OrganizationRegistration)
  @JoinColumn()
  registrationRecord!: OrganizationRegistration;

  @OneToOne(() => User, (user) => user.organization)
  @JoinColumn({ name: 'userId' })
  user!: User;
}
