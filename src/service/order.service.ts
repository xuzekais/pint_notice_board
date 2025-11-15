import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '@app/entity/order.entity';
import { OrderFile } from '@app/entity/order_file.entity';

@Provide()
export class OrderService {
  @InjectEntityModel(Order)
  orderRepo: Repository<Order>;
  @InjectEntityModel(OrderFile)
  orderFileRepo: Repository<OrderFile>;

  /**
   * 批量插入或更新订单数据（分批），返回插入失败的订单 id 列表
   */
  async bulkUpsertOrders(orders: Array<any>): Promise<{ inserted: number; failed: string[] }> {
    const repo = this.orderRepo;
    const failed: string[] = [];
    let inserted = 0;

    // 使用 upsert 来提高性能（TypeORM 0.3+ 支持），需要 merge_order_id 存在唯一约束或为主键
    const chunkSize = 200; // 批量大小可调
    for (let i = 0; i < orders.length; i += chunkSize) {
      const chunk = orders.slice(i, i + chunkSize).map(o => ({
        merge_order_id: String(o.merge_order_id),
        take_code: o.take_code || null,
        user_id: o.user_id || null,
        pay_date: o.pay_date || null,
        actual_pay_price: o.actual_pay_price || 0,
        order_status: o.order_status || 0,
        cell_phone: o.cell_phone || null,
        address_num: o.address_num || null,
        address_detail: o.address_detail || null,
        remark: o.remark || null,
      }) as Partial<Order>);

      try {
        // upsert 批量操作（基于 merge_order_id 冲突时更新）
        await repo.upsert(chunk as any, ['merge_order_id']);
        inserted += chunk.length;
      } catch (e) {
        // 回退：尝试使用 insert（更快）或逐条 save
        try {
          await repo.insert(chunk as any);
          inserted += chunk.length;
        } catch (e2) {
          for (const o of chunk) {
            try {
              await repo.save(o as any);
              inserted++;
            } catch (err) {
              if (o && (o as any).merge_order_id) failed.push(String((o as any).merge_order_id));
            }
          }
        }
      }
    }

    return { inserted, failed };
  }

  mapRemoteToOrder(item: any) {
    const parseDotNetDate = (s?: string) => {
      if (!s) return null;
      const m = /\/Date\((\d+)(?:[+-]\d+)?\)\//.exec(s);
      if (m) return new Date(parseInt(m[1], 10));
      const n = Date.parse(s);
      return isNaN(n) ? null : new Date(n);
    };

    const merge_order_id = item.MergeOrderId || item.mergeOrderId || item.merge_order_id || item.MergeOrderId || '';
    const take_code = item.OrderTakeCode || item.TakeCode || item.take_code || null;
    const user_id = item.UserId || item.userId || item.user_id || null;
    const pay_date = parseDotNetDate(item.PayDate || item.payDate || item.pay_date);
    const actual_pay_price = Number(item.ActualPayPrice || item.actualPayPrice || item.actual_pay_price || 0);
    const order_status = Number(item.OrderStatus || item.orderStatus || item.order_status || 0);
    const cell_phone = item.CellPhone || item.cellPhone || item.cell_phone || null;
    const address_num = item.AddressNum || item.addressNum || item.address_num || null;
    const address_detail = item.Address || item.AddressDetail || item.address_detail || null;
    const remark = item.Remark || item.remark || null;

    return {
      merge_order_id: String(merge_order_id),
      take_code,
      user_id: user_id ? String(user_id) : null,
      pay_date,
      actual_pay_price,
      order_status,
      cell_phone,
      address_num,
      address_detail,
      remark,
    };
  }

  async processRemoteOrders(rawItems: any[]): Promise<{ inserted: number; failed: string[] }> {
    const mapped = rawItems.map(it => this.mapRemoteToOrder(it)).filter(o => o.merge_order_id);
    return this.bulkUpsertOrders(mapped);
  }

  /**
   * map remote file record to OrderFile entity shape
   */
  mapRemoteToOrderFile(item: any, mergeOrderId: string) {
    const print_pages = Number(item.PrintPages || item.printPages || item.print_pages || 0);
    const paper_kind = item.PaperKind || item.paperKind || item.paper_kind || item.Paper || null;
    const color = item.Color || item.color || null;
    // duplex may be 'true'/'false' or 1/0
    const duplexRaw = item.Duplex || item.duplex || item.IsDuplex || null;
    const duplex = duplexRaw === 'true' || duplexRaw === true || Number(duplexRaw) === 1;
    const file_name = item.FileName || item.fileName || item.file_name || null;
    const file_type = item.FileType || item.fileType || item.file_type || null;
    const order_no = item.OrderNo || item.orderNo || item.order_no || null;

    return {
      merge_order_id: String(mergeOrderId),
      order_no: order_no ? String(order_no) : null,
      print_pages,
      paper_kind: paper_kind || null,
      color: color || null,
      duplex: !!duplex,
      file_name: file_name || null,
      file_type: file_type || null,
    } as Partial<OrderFile>;
  }

  async bulkUpsertOrderFiles(files: Array<any>): Promise<{ inserted: number; failed: string[] }> {
    const repo = this.orderFileRepo;
    const failed: string[] = [];
    let inserted = 0;
    const chunkSize = 1000;
    for (let i = 0; i < files.length; i += chunkSize) {
      // 先切片
      const rawChunk = files.slice(i, i + chunkSize) as Partial<OrderFile>[];
      // 在同一批次内按 merge_order_id + order_no 去重，保留最后一条（避免同一 INSERT 中出现重复导致 MySQL 1062）
      const dedupeMap = new Map<string, Partial<OrderFile>>();
      for (const f of rawChunk) {
        const mk = String((f && (f as any).merge_order_id) || '');
        // 统一把 null/undefined 转为空字符串，以便作为 key
        const on = (f && (f as any).order_no) == null ? '' : String((f as any).order_no);
        const key = `${mk}||${on}`;
        // 保留后出现的那条记录（覆盖之前的）
        dedupeMap.set(key, f);
      }
      const chunk = Array.from(dedupeMap.values()) as Partial<OrderFile>[];
      try {
        // 使用 upsert（需要在数据库中为 merge_order_id + order_no 建立唯一索引）
        await repo.upsert(chunk as any, ['merge_order_id', 'order_no']);
        inserted += chunk.length;
      } catch (e) {
        // 回退：尝试 insert
        try {
          await repo.insert(chunk as any);
          inserted += chunk.length;
        } catch (e2) {
          // 最后逐条保存并记录失败
          for (const f of chunk) {
            try {
              await repo.save(f as any);
              inserted++;
            } catch (err) {
              if (f && (f as any).order_no) failed.push(String((f as any).order_no));
            }
          }
        }
      }
    }

    return { inserted, failed };
  }

  /**
   * fetch order files for a merge order id from remote API and save into DB
   */
  async fetchOrderFilesForMergeId(mergeOrderId: string, cookie?: string): Promise<any[] | null> {
    const fetchImpl: any = (globalThis as any).fetch;
    if (!fetchImpl) return null;
    const rowsPerPage = 200;
    let page = 1;
    const all: any[] = [];
    while (true) {
      const url = `https://youfan.iyint.com/Depot/print/ashx/ManageOrder.ashx?page=${page}&rows=${rowsPerPage}&action=getlist&OrderStatus=-1&PrintType=1&OrderPayStatus=2&MergeOrderId=${encodeURIComponent(mergeOrderId)}&DeliveryType=`;
      const res = await fetchImpl(url, { method: 'GET', headers: { 'Cookie': cookie || '', 'Accept': 'application/json, text/html, */*' }, redirect: 'follow' });
      let data: any = null;
      try {
        const text = await res.text();
        try { data = JSON.parse(text); } catch (e) {
          const first = text.indexOf('{'); const last = text.lastIndexOf('}');
          if (first !== -1 && last !== -1) {
            try { data = JSON.parse(text.slice(first, last + 1)); } catch (e2) { data = null; }
          }
        }
      } catch (e) { data = null; }
      if (!data) break;
      let list: any[] = [];
      if (Array.isArray(data.rows)) list = data.rows;
      else if (Array.isArray(data.data)) list = data.data;
      else if (Array.isArray(data.List)) list = data.List;
      else if (Array.isArray(data.result)) list = data.result;
      else if (Array.isArray(data)) list = data;
      else if (data.Data && Array.isArray(data.Data.rows)) list = data.Data.rows;
      if (!list || list.length === 0) break;
      all.push(...list);
      if (list.length < rowsPerPage) break;
      page++;
    }
    return all;
  }

  async processAndSaveOrderFilesForMergeId(mergeOrderId: string, cookie?: string): Promise<{ inserted: number; failed: string[] }> {
    const raw = await this.fetchOrderFilesForMergeId(mergeOrderId, cookie);
    if (!raw || raw.length === 0) return { inserted: 0, failed: [] };
    const mapped = raw.map((r: any) => this.mapRemoteToOrderFile(r, mergeOrderId));
    return this.bulkUpsertOrderFiles(mapped);
  }

  /**
   * 查询订单列表并关联用户昵称 user_name
   * opts: { page, pageSize, mergeOrderId, userId }
   */
  async getOrderList(opts?: { page?: number; pageSize?: number; mergeOrderId?: string; userId?: string; orderType?: string; payStart?: string; payEnd?: string; addressNum?: string }) {
    const page = opts?.page && opts.page > 0 ? opts.page : 1;
    const pageSize = opts?.pageSize && opts.pageSize > 0 ? opts.pageSize : 0;

    const whereParts: string[] = [];
    const params: any[] = [];
    if (opts?.mergeOrderId) {
      whereParts.push('o.merge_order_id = ?');
      params.push(opts.mergeOrderId);
    }
    if (opts?.userId) {
      whereParts.push('o.user_id = ?');
      params.push(opts.userId);
    }
    // 支付时间范围
    if (opts?.payStart) {
      whereParts.push('o.pay_date >= ?');
      params.push(opts.payStart);
    }
    if (opts?.payEnd) {
      whereParts.push('o.pay_date <= ?');
      params.push(opts.payEnd);
    }
    // 地址编码过滤
    if (opts?.addressNum) {
      whereParts.push('o.address_num = ?');
      params.push(opts.addressNum);
    }

    // 订单类型到 order_status 的映射（假设映射如下）
    // 已付款 -> 1, 已打印 -> 2, 待退款 -> 3, 已退款 -> 4, 已拒绝退款 -> 5
    // 这是推断的映射；如需不同映射请告诉我实际值。
    if (opts?.orderType) {
      const map: Record<string, number> = {
        paid: 1,
        printed: 2,
        refund_pending: 3,
        refunded: 4,
        refund_rejected: 5,
        // 支持中文或常见别名
        已付款: 1,
        已打印: 2,
        待退款: 3,
        已退款: 4,
        已拒绝退款: 5,
      };
      const key = opts.orderType as string;
      const v = map[key];
      if (v !== undefined) {
        whereParts.push('o.order_status = ?');
        params.push(v);
      }
    }

    const whereClause = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';
    const limitClause = pageSize ? `LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}` : '';

    // total count
    const countSql = `SELECT COUNT(1) as cnt FROM t_order o LEFT JOIN t_user u ON u.user_id = o.user_id ${whereClause}`;
    const countRes: any[] = await this.orderRepo.query(countSql, params);
    const total = (countRes && countRes[0] && Number(countRes[0].cnt)) || 0;

    const sql = `
      SELECT o.merge_order_id, o.take_code, u.user_name, o.user_id, o.pay_date, o.actual_pay_price,
        o.order_status, o.cell_phone, o.address_num, o.address_detail, o.remark
      FROM t_order o
      LEFT JOIN t_user u ON u.user_id = o.user_id
      ${whereClause}
      ORDER BY o.pay_date DESC
      ${limitClause}
    `;

    const raw: any[] = await this.orderRepo.query(sql, params);
    const data = raw.map(r => ({
      merge_order_id: r.merge_order_id,
      take_code: r.take_code,
      user_name: r.user_name,
      user_id: r.user_id,
      pay_date: r.pay_date ? new Date(r.pay_date) : null,
      actual_pay_price: r.actual_pay_price,
      order_status: r.order_status,
      cell_phone: r.cell_phone,
      address_num: r.address_num,
      address_detail: r.address_detail,
      remark: r.remark,
    }));

    return { data, total, page, pageSize };
  }
}
