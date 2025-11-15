import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/entity/user.entity';

@Provide()
export class UserService {
  @InjectEntityModel(User)
  userRepo: Repository<User>;

  // 查询用户列表并附带首次下单时间（first_order_date）
  // opts 支持: { page, pageSize, hasFirstOrder, regStart, regEnd, firstOrderStart, firstOrderEnd }
  async getUserList(opts?: {
    page?: number;
    pageSize?: number;
    hasFirstOrder?: string; // '1' or '0'
    regStart?: string;
    regEnd?: string;
    firstOrderStart?: string;
    firstOrderEnd?: string;
    userId?: string;
  }) {
    const page = opts?.page && opts.page > 0 ? opts.page : 1;
    const pageSize = opts?.pageSize && opts.pageSize > 0 ? opts.pageSize : 0;

    const whereParts: string[] = [];
    const whereParams: any[] = [];
    const havingParts: string[] = [];
    const havingParams: any[] = [];

    // 注册日期范围过滤（在 WHERE 中）
    if (opts?.regStart) {
      whereParts.push('u.register_date >= ?');
      whereParams.push(opts.regStart);
    }
    if (opts?.regEnd) {
      whereParts.push('u.register_date <= ?');
      whereParams.push(opts.regEnd);
    }

    // 精确匹配 user_id 过滤
    if (opts?.userId) {
      whereParts.push('u.user_id = ?');
      whereParams.push(opts.userId);
    }

    // 首次下单日期范围过滤（使用 HAVING，因为它是聚合结果）
    if (opts?.firstOrderStart) {
      havingParts.push('MIN(o.pay_date) >= ?');
      havingParams.push(opts.firstOrderStart);
    }
    if (opts?.firstOrderEnd) {
      havingParts.push('MIN(o.pay_date) <= ?');
      havingParams.push(opts.firstOrderEnd);
    }

    // 是否有首次下单（近似：没有电话认为没下过单）
    if (opts?.hasFirstOrder === '1') {
      // 包括明确有下单记录，或有电话（近似认为可能下过单）
      havingParts.push("(MIN(o.pay_date) IS NOT NULL OR (u.cell_phone IS NOT NULL AND u.cell_phone <> ''))");
    } else if (opts?.hasFirstOrder === '0') {
      // 明确认为没有首次下单：没有下单记录，且没有电话
      havingParts.push("(MIN(o.pay_date) IS NULL AND (u.cell_phone IS NULL OR u.cell_phone = ''))");
    }

    const limitClause = pageSize ? `LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}` : '';

    let sql = `
      SELECT u.user_id, u.user_name, u.cell_phone, u.register_date,
        MIN(o.pay_date) AS first_order_date
      FROM t_user u
      LEFT JOIN t_order o ON o.user_id = u.user_id AND o.pay_date IS NOT NULL
    `;

    if (whereParts.length) {
      sql += ' WHERE ' + whereParts.join(' AND ');
    }

    sql += '\n      GROUP BY u.user_id, u.user_name, u.cell_phone, u.register_date\n';

    if (havingParts.length) {
      sql += ' HAVING ' + havingParts.join(' AND ');
    }

    sql += '\n      ORDER BY u.register_date DESC\n      ' + limitClause;

    const params = [...whereParams, ...havingParams];
    const raw: any[] = await this.userRepo.query(sql, params);

    return raw.map(r => ({
      user_id: r.user_id,
      user_name: r.user_name,
      cell_phone: r.cell_phone,
      register_date: r.register_date ? new Date(r.register_date) : null,
      first_order_date: r.first_order_date ? new Date(r.first_order_date) : null,
    }));
  }

  /**
   * 批量插入或更新用户数据，使用注入的 repository，返回插入失败的账号名数组
   * 对于大量数据，可后续改为批量 insert 提升性能
   */
  async bulkUpsertUsers(users: Array<any>): Promise<{ inserted: number; failed: string[] }> {
    const repo = this.userRepo;
    const failed: string[] = [];
    let inserted = 0;

    // 分批提交，减少单次事务开销
    const chunkSize = 200;
    for (let i = 0; i < users.length; i += chunkSize) {
        const chunk = users.slice(i, i + chunkSize).map(u => ({
          user_id: String(u.user_id),
          user_name: u.user_name || null,
          cell_phone: u.cell_phone || null,
          register_date: u.register_date || null,
        }) as Partial<User>);

      try {
        const saved = await repo.save(chunk as any);
        inserted += Array.isArray(saved) ? saved.length : 1;
      } catch (e) {
        // 粒度回退：逐条保存以记录失败项
        for (const u of chunk) {
          try {
            await repo.save(u as any);
            inserted++;
          } catch (err) {
            if (u && (u as any).user_id) failed.push(String((u as any).user_id));
          }
        }
      }
    }

    return { inserted, failed };
  }

  /**
   * 将远端接口返回的原始条目映射为本系统 User 对象
   */
  mapRemoteToUser(item: any) {
    const parseDotNetDate = (s?: string) => {
      if (!s) return null;
      const m = /\/Date\((\d+)(?:[+-]\d+)?\)\//.exec(s);
      if (m) return new Date(parseInt(m[1], 10));
      const n = Date.parse(s);
      return isNaN(n) ? null : new Date(n);
    };

    const user_id =  item.UserId || item.userName || item.userId || '';
    const user_name = item.NickName || item.RealName || item.UserName || null;
    const cell_phone = item.CellPhone || item.cellPhone || item.Phone || null;
    const register_date = parseDotNetDate(item.CreateDate || item.createDate || item.RegisterDate);
      // OrderNumber 可用于业务判断是否下过单，但当前需求不保存该字段
      // 如果后续需要，可返回该值或在业务层判断
      // const orderNumber = Number(item.OrderNumber || item.orderNumber || 0);

    return {
      user_id: String(user_id),
      user_name: user_name || null,
      cell_phone: cell_phone || null,
      register_date,
  // first_order_date 已移除
  // is_have_order 字段已移除
    };
  }

  /**
   * 接受远端原始数组，映射并批量插入，返回插入统计
   */
  async processRemoteUsers(rawItems: any[]): Promise<{ inserted: number; failed: string[] }> {
    const mapped = rawItems.map(it => this.mapRemoteToUser(it)).filter(u => u.user_id);
    return this.bulkUpsertUsers(mapped);
  }
}
