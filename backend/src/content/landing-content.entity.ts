import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'landing_content' })
export class LandingContentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  locale!: string;

  @Column({ type: 'text' })
  payload!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
