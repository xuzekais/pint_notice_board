import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('t_address_type')
export class AddressType {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'address_num' })
    address_num: number;

  @Column({ type: 'varchar', length: 200, nullable: false, comment: '地址名称/描述' })
  address_text: string;
  
  @Column({ type: 'varchar', length: 1000, nullable: true, comment: '地址扩展信息（例如打印备注等）' })
  extra_info: string | null;
  
  @CreateDateColumn({ type: 'datetime', name: 'create_time', comment: '创建时间' })
  create_time: Date;
}
