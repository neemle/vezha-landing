import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'leads' })
export class LeadEntity {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ example: 'Olena' })
  @Column({ nullable: true })
  name?: string;

  @ApiProperty({ example: 'you@company.com' })
  @Column()
  email!: string;

  @ApiProperty({ example: '+380...' })
  @Column({ nullable: true })
  phone?: string;

  @ApiProperty({ example: 'Monitoring Bitrix24 and VPN gateway' })
  @Column({ type: 'text', nullable: true })
  message?: string;

  @ApiProperty({ example: 'en' })
  @Column({ nullable: true })
  lang?: string;

  @ApiProperty({ default: false })
  @Column({ type: 'boolean', default: false })
  bad!: boolean;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  @Column({ type: 'datetime', name: 'exported_at', nullable: true })
  exportedAt?: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
