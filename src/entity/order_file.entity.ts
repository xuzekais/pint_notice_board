import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm';

@Entity('t_order_file')
export class OrderFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, comment: '合并订单号，引用 t_order.merge_order_id' })
  @Index()
  merge_order_id: string;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '子订单号/文件对应的订单编号' })
  order_no: string | null;

  @Column({ type: 'int', default: 0, comment: '打印页数' })
  print_pages: number;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '纸张种类（例如 A4/A3）' })
  paper_kind: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true, comment: '颜色（彩色/黑白）' })
  color: string | null;

  @Column({ type: 'boolean', default: false, comment: '是否双面（true 双面 / false 单面）' })
  duplex: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '文档文件名' })
  file_name: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '文件类型/格式（pdf/docx）' })
  file_type: string | null;

  @CreateDateColumn({ comment: '记录创建时间' })
  create_time: Date;
}
