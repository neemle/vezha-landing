import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PageCategoryEntity } from './page-category.entity';
import { StaticPageTranslationEntity } from './static-page-translation.entity';

@Entity({ name: 'static_pages' })
export class StaticPageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'boolean', default: false })
  published!: boolean;

  @ManyToOne(() => PageCategoryEntity, (category) => category.pages, { onDelete: 'RESTRICT' })
  category!: PageCategoryEntity;

  @OneToMany(() => StaticPageTranslationEntity, (translation) => translation.page, { cascade: true })
  translations!: StaticPageTranslationEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

