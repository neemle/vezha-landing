import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadEntity } from './lead.entity';

export type LeadExportState = 'all' | 'exported' | 'unexported';

export type LeadListFilter = {
  exported?: LeadExportState;
  includeBad?: boolean;
  search?: string;
};

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepo: Repository<LeadEntity>,
  ) {}

  async create(dto: CreateLeadDto): Promise<LeadEntity> {
    const lead = this.leadRepo.create(dto);
    return this.leadRepo.save(lead);
  }

  async list(filter: LeadListFilter = {}): Promise<LeadEntity[]> {
    const qb = this.leadRepo
      .createQueryBuilder('lead')
      .orderBy('lead.created_at', 'DESC');

    if (filter.exported === 'exported') {
      qb.where('lead.exported_at IS NOT NULL');
    } else if (filter.exported === 'unexported') {
      qb.where('lead.exported_at IS NULL');
    }

    if (filter.includeBad === false) {
      qb.andWhere('lead.bad = :bad', { bad: false });
    }

    if (filter.search) {
      qb.andWhere(
        '(lead.email LIKE :term OR lead.name LIKE :term OR lead.phone LIKE :term)',
        { term: `%${filter.search}%` },
      );
    }

    return qb.getMany();
  }

  async setBadFlag(id: number, bad: boolean): Promise<LeadEntity> {
    const lead = await this.leadRepo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    lead.bad = bad;
    return this.leadRepo.save(lead);
  }

  async exportPending(): Promise<LeadEntity[]> {
    const leads = await this.leadRepo.find({
      where: { bad: false, exportedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
    if (leads.length === 0) return [];
    const now = new Date();
    leads.forEach((lead) => {
      lead.exportedAt = now;
    });
    await this.leadRepo.save(leads);
    return leads;
  }
}
