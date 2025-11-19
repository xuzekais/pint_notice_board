import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '@app/entity/order.entity';
import { OrderFile } from '@app/entity/order_file.entity';
import { chineseToCode } from '../types/building.enum';

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
  const address_detail = item.Address || item.AddressDetail || item.address_detail || null;
  // 先尝试从 address_detail 中解析栋数标签并映射为编码
  const extractLabel = this.extractBuildingFromAddress(address_detail);
  const address_num = extractLabel ? chineseToCode(extractLabel) : null;
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

  /**
   * 从 address 字符串中提取楼栋标签（按规则：
   *  1) 获取 address 中最外层括号内的内容（从第一个 '('/ '（' 到最后一个 ')' / '）'）
   *  2) 对该内容去除所有内层括号及其内容，保留外层主体文本并去除首尾空白
   * 返回示例：
   *  - "A508(图书馆（须备注…）)" -> "图书馆"
   *  - "xxx(北苑（须备注…（只送到北1））)" -> "北苑"
   */
  extractBuildingFromAddress(address?: string): string | undefined {
    if (!address) return undefined;
    const s = String(address);
    // 找到第一个开括号和最后一个闭括号（支持半角和全角）
    const firstOpenIdxs = [s.indexOf('('), s.indexOf('（')].filter(i => i >= 0);
    const lastCloseIdxs = [s.lastIndexOf(')'), s.lastIndexOf('）')].filter(i => i >= 0);
    let inner = s;
    if (firstOpenIdxs.length > 0 && lastCloseIdxs.length > 0) {
      const firstOpen = Math.min(...firstOpenIdxs);
      const lastClose = Math.max(...lastCloseIdxs);
      if (firstOpen < lastClose) {
        inner = s.substring(firstOpen + 1, lastClose);
      }
    }
    // 反复删除最内层的括号及其内容，直到没有括号为止（处理嵌套）
    let prev: string;
    let cur = inner;
    const innerParenRegex = /\([^()]*\)|（[^（）]*）/g;
    do {
      prev = cur;
      cur = cur.replace(innerParenRegex, '');
    } while (cur !== prev && innerParenRegex.test(prev));

    const res = cur.trim();
    return res === '' ? undefined : res;
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
   * opts: { page, pageSize, mergeOrderId, userId, fileName }
   */
  async getOrderList(opts?: { page?: number; pageSize?: number; mergeOrderId?: string; userId?: string; orderType?: string; payStart?: string; payEnd?: string; addressNum?: string; fileName?: string }) {
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
    
    // 文档名称模糊搜索（需要关联子订单表）
    let needFileJoin = false;
    if (opts?.fileName) {
      needFileJoin = true;
      whereParts.push('f.file_name LIKE ?');
      params.push(`%${opts.fileName}%`);
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

    // 如果需要根据文档名称搜索，需要关联子订单表
    const fileJoinClause = needFileJoin ? 'INNER JOIN t_order_file f ON f.merge_order_id = o.merge_order_id' : '';
    const distinctClause = needFileJoin ? 'DISTINCT' : '';

    // total count
    const countSql = `SELECT COUNT(${distinctClause} o.merge_order_id) as cnt FROM t_order o LEFT JOIN t_user u ON u.user_id = o.user_id ${fileJoinClause} ${whereClause}`;
    const countRes: any[] = await this.orderRepo.query(countSql, params);
    const total = (countRes && countRes[0] && Number(countRes[0].cnt)) || 0;

    const sql = `
      SELECT ${distinctClause} o.merge_order_id, o.take_code, u.user_name, o.user_id, o.pay_date, o.actual_pay_price,
        o.order_status, o.cell_phone, o.address_num, o.address_detail, o.remark
      FROM t_order o
      LEFT JOIN t_user u ON u.user_id = o.user_id
      ${fileJoinClause}
      ${whereClause}
      ORDER BY o.pay_date DESC
      ${limitClause}
    `;

    const raw: any[] = await this.orderRepo.query(sql, params);
    
    // 获取所有合并订单ID
    const mergeOrderIds = raw.map(r => r.merge_order_id);
    
    // 批量查询子订单
    let childrenMap: Record<string, any[]> = {};
    if (mergeOrderIds.length > 0) {
      const childrenSql = `
        SELECT id, merge_order_id, order_no, print_pages, paper_kind, color, duplex, file_name, file_type
        FROM t_order_file
        WHERE merge_order_id IN (${mergeOrderIds.map(() => '?').join(',')})
        ORDER BY merge_order_id, id ASC
      `;
      const childrenRaw: any[] = await this.orderFileRepo.query(childrenSql, mergeOrderIds);
      
      // 按 merge_order_id 分组
      childrenRaw.forEach(child => {
        const key = child.merge_order_id;
        if (!childrenMap[key]) {
          childrenMap[key] = [];
        }
        
        // 如果 file_type 为空，从 file_name 中提取文件后缀
        let fileType = child.file_type;
        if (!fileType && child.file_name) {
          const lastDot = child.file_name.lastIndexOf('.');
          if (lastDot > 0 && lastDot < child.file_name.length - 1) {
            fileType = child.file_name.substring(lastDot + 1).toLowerCase();
          }
        }
        
        childrenMap[key].push({
          id: child.id,
          merge_order_id: child.merge_order_id,
          order_no: child.order_no,
          print_pages: child.print_pages,
          paper_kind: child.paper_kind,
          color: child.color,
          duplex: child.duplex,
          file_name: child.file_name,
          file_type: fileType,
        });
      });
    }
    
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
      children: childrenMap[r.merge_order_id] || [],
    }));

    return { data, total, page, pageSize };
  }

  /**
   * 根据 merge_order_id 查询子订单列表（order_file 表）
   */
  async getOrderFiles(mergeOrderId: string) {
    const files = await this.orderFileRepo.find({
      where: { merge_order_id: mergeOrderId },
      order: { id: 'ASC' },
    });
    return files.map(f => {
      // 如果 file_type 为空，从 file_name 提取文件后缀
      let fileType = f.file_type;
      if (!fileType && f.file_name) {
        const lastDot = f.file_name.lastIndexOf('.');
        if (lastDot > 0 && lastDot < f.file_name.length - 1) {
          fileType = f.file_name.substring(lastDot + 1).toLowerCase();
        }
      }
      
      return {
        id: f.id,
        merge_order_id: f.merge_order_id,
        order_no: f.order_no,
        print_pages: f.print_pages,
        paper_kind: f.paper_kind,
        color: f.color,
        duplex: f.duplex,
        file_name: f.file_name,
        file_type: fileType,
        create_time: f.create_time,
      };
    });
  }

  /**
   * 按地址编码统计订单汇总
   * 支持时间范围过滤，默认当月
   */
  async getOrderSummary(opts?: { startDate?: string; endDate?: string }) {
    const whereParts: string[] = [];
    const params: any[] = [];

    // 默认当月
    let startDate = opts?.startDate;
    let endDate = opts?.endDate;
    
    if (!startDate || !endDate) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      
      // 当月第一天
      const firstDay = new Date(year, month, 1);
      startDate = firstDay.toISOString().split('T')[0];
      
      // 当月最后一天
      const lastDay = new Date(year, month + 1, 0);
      endDate = lastDay.toISOString().split('T')[0];
    }

    // 支付时间范围过滤
    whereParts.push('pay_date >= ?');
    params.push(startDate + ' 00:00:00');
    whereParts.push('pay_date <= ?');
    params.push(endDate + ' 23:59:59');

    const whereClause = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';

    const sql = `
      SELECT 
        COALESCE(address_num, 35) as address_num,
        COUNT(*) as order_count,
        SUM(actual_pay_price) as total_amount
      FROM t_order
      ${whereClause}
      GROUP BY COALESCE(address_num, 35)
      ORDER BY address_num ASC
    `;

    const raw: any[] = await this.orderRepo.query(sql, params);
    
    return {
      data: raw.map(r => ({
        address_num: Number(r.address_num),
        order_count: Number(r.order_count),
        total_amount: Number(r.total_amount) || 0,
      })),
      startDate,
      endDate,
    };
  }

  /**
   * 按小时统计订单数量（0-23小时）
   * 支持地址编码过滤
   */
  async getOrderHourlyStats(opts?: { addressNum?: string; startDate?: string; endDate?: string }) {
    const whereParts: string[] = [];
    const params: any[] = [];

    // 地址编码过滤
    if (opts?.addressNum) {
      whereParts.push('address_num = ?');
      params.push(opts.addressNum);
    }

    // 默认查询最近30天的数据
    let startDate = opts?.startDate;
    let endDate = opts?.endDate;
    
    if (!startDate || !endDate) {
      const now = new Date();
      endDate = now.toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
    }

    // 支付时间范围过滤
    whereParts.push('pay_date >= ?');
    params.push(startDate + ' 00:00:00');
    whereParts.push('pay_date <= ?');
    params.push(endDate + ' 23:59:59');

    const whereClause = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';

    const sql = `
      SELECT 
        HOUR(pay_date) as hour,
        COUNT(*) as order_count
      FROM t_order
      ${whereClause}
      GROUP BY HOUR(pay_date)
      ORDER BY hour ASC
    `;

    const raw: any[] = await this.orderRepo.query(sql, params);
    
    // 构建完整的0-23小时数据，没有订单的小时补0
    const hourlyData: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }
    
    raw.forEach(r => {
      const hour = Number(r.hour);
      hourlyData[hour] = Number(r.order_count);
    });

    return {
      data: Object.keys(hourlyData).map(h => ({
        hour: Number(h),
        order_count: hourlyData[Number(h)],
      })),
      startDate,
      endDate,
    };
  }
}
