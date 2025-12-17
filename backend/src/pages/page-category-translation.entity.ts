import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { PageCategoryEntity } from './page-category.entity';

@Entity({ name: 'page_category_translations' })
@Unique('uniq_page_category_translation', ['category', 'locale'])
export class PageCategoryTranslationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => PageCategoryEntity, (category) => category.translations, { onDelete: 'CASCADE' })
  category!: PageCategoryEntity;

  @Column()
  locale!: string;

  @Column()
  title!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

