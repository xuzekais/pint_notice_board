import { Entity, Column, PrimaryColumn, Index, CreateDateColumn } from 'typeorm';

@Entity('t_order')
export class Order {
  @PrimaryColumn({ type: 'varchar', length: 64, comment: '合并订单号/订单号（主键）' })
  merge_order_id: string;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '取件码' })
  @Index()
  take_code: string | null;

  @Column({ type: 'varchar', length: 64, nullable: false, comment: '下单账号名' })
  @Index()
  user_id: string;

  @Column({ type: 'datetime', nullable: true, comment: '支付时间，格式 YYYY-MM-DD hh:mm:ss' })
  pay_date: Date | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0, comment: '实付金额' })
  actual_pay_price: string;

  @Column({ type: 'int', default: 0, comment: '订单状态（枚举）' })
  order_status: number;

  @Column({ type: 'varchar', length: 32, nullable: true, comment: '联系电话' })
  cell_phone: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '地址编码，引用 t_address_type.address_num' })
  @Index()
  address_num: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '详细地址' })
  address_detail: string | null;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark: string | null;

  @Column({ type: 'boolean', default: false, comment: '是否已发送短信给门店' })
  is_send_msg_to_store: boolean;

  @CreateDateColumn({ comment: '记录创建时间' })
  create_time: Date;
}
