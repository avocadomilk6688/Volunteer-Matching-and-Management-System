import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class OrganizationRegistration {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ nullable: true })
  name!: string;

  @Column({ type: 'varchar', length: 500 })
  description!: string;

  @Column('simple-array')
  submitted_documents!: string[];

  @Column()
  authorized_person!: string;

  @Column()
  submission_time!: Date;

  @Column()
  status!: string;
}
