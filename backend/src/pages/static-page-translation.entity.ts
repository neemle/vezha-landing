import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { StaticPageEntity } from './static-page.entity';

@Entity({ name: 'static_page_translations' })
@Unique('uniq_static_page_translation', ['page', 'locale'])
export class StaticPageTranslationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => StaticPageEntity, (page) => page.translations, { onDelete: 'CASCADE' })
  page!: StaticPageEntity;

  @Column()
  locale!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

