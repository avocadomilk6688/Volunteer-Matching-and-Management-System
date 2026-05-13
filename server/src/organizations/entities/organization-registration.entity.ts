import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('organization_registration')
export class OrganizationRegistration {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 500 })
  description!: string;

  /**
   * Stored as a comma-separated string in the DB,
   * but handled as an array in TypeScript.
   */
  @Column('simple-array')
  submitted_documents!: string[];

  @Column({ type: 'varchar', length: 255 })
  authorized_person!: string;

  @Column({ type: 'datetime' })
  submission_time!: Date;

  @Column({ type: 'varchar', length: 255 })
  status!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string;
}
