import { Entity, Column, PrimaryColumn, OneToOne, OneToMany } from 'typeorm';
import { Volunteer } from '../../volunteers/entities/volunteer.entity';
import { Admin } from './admin.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Notification } from '../../interactions/entities/notification.entity';
import type { Relation } from 'typeorm';

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
  // Use a union type here for better autocomplete/safety
  role!: 'admin' | 'volunteer' | 'organization';

  // ─── FIXED TYPEORM UNION COLUMN TYPE HERE ───
  @Column({ type: 'varchar', nullable: true, name: 'reset_password_token' }) // 👈 Added type: 'varchar' explicitly
  resetPasswordToken?: string | null;

  // Relation<> helps fix that "Error typed value" linter bug
  @OneToOne(() => Volunteer, (volunteer) => volunteer.user, { eager: true })
  volunteer?: Relation<Volunteer>;

  @OneToOne(() => Admin, (admin) => admin.user, { eager: true })
  admin?: Relation<Admin>;

  @OneToOne(() => Organization, (organization) => organization.user, {
    eager: true,
  })
  organization?: Relation<Organization>;

  // Inverse side of the notification relationship
  @OneToMany(() => Notification, (notification) => notification.receiver)
  notifications?: Relation<Notification[]>;
}
