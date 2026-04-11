import { Entity, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { Admin } from '../../users/entities/admin.entity';

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

  @ManyToOne(() => Admin)
  admin!: Admin;
}
