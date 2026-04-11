import { Entity, Column, PrimaryColumn } from 'typeorm';
// import { Admin } from '../../users/entities/admin.entity'; // Adjust path based on your folder

@Entity()
export class QuestionAnswer {
  @PrimaryColumn({ type: 'varchar', length: 10 })
  id!: string;

  @Column({ type: 'text' })
  question!: string;

  @Column({ type: 'text', nullable: true })
  answer!: string;

  @Column()
  category!: string;

  //   @ManyToOne(() => Admin)
  //   admin!: Admin;
}
