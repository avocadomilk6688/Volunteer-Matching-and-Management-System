import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrganizationRegistration } from './organization-registration.entity';

@Entity('organization') // Force explicit lower-case table name matching
export class Organization {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string;

  @Column({ type: 'double', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column({ type: 'varchar', length: 255 })
  profile_picture_url!: string;

  @Column({ type: 'varchar', length: 255 })
  contact_number!: string;

  @OneToOne(() => OrganizationRegistration)
  @JoinColumn({ name: 'registrationRecordId' }) // Maps property directly to the underlying foreign key column
  registrationRecord!: OrganizationRegistration;

  @OneToOne(() => User, (user) => user.organization)
  @JoinColumn({ name: 'userId' }) // Maps property directly to your table's userId column
  user!: User;
}
