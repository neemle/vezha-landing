import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PageCategoryTranslationEntity } from './page-category-translation.entity';
import { StaticPageEntity } from './static-page.entity';

@Entity({ name: 'page_categories' })
export class PageCategoryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @OneToMany(() => PageCategoryTranslationEntity, (translation) => translation.category, { cascade: true })
  translations!: PageCategoryTranslationEntity[];

  @OneToMany(() => StaticPageEntity, (page) => page.category)
  pages!: StaticPageEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

