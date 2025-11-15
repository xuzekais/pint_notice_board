import { Entity, Column, PrimaryColumn, Index, CreateDateColumn } from 'typeorm';

@Entity('t_user')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 64, name: 'user_id', comment: '账号名（主键）' })
  user_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '昵称' })
  user_name: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true, comment: '电话' })
  @Index()
  cell_phone: string | null;

  @Column({ type: 'datetime', nullable: true, comment: '注册日期，格式 YYYY-MM-DD hh:mm:ss' })
  register_date: Date | null;

  @CreateDateColumn({ comment: '记录创建时间' })
  create_time: Date;
}
