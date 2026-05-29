import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('organization_registration')
export class OrganizationRegistration {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  // Maps your preferred TypeScript property 'organizationName' to the MySQL column 'name'
  @Column({ name: 'name', type: 'varchar', length: 255 })
  organizationName!: string;

  @Column({ type: 'varchar', length: 500 })
  description!: string;

  // Maps your preferred TypeScript property 'supporting_documents' to the MySQL 'simple-array' column
  @Column('simple-array', { name: 'submitted_documents' })
  supporting_documents!: string[];

  // Maps your preferred TypeScript property 'authorizedPersonName' to the MySQL column 'authorized_person'
  @Column({ name: 'authorized_person', type: 'varchar', length: 255 })
  authorizedPersonName!: string;

  @Column({ type: 'datetime' })
  submission_time!: Date;

  @Column({ type: 'varchar', length: 255 })
  status!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string;
}
