// Removed accidental leading code fence
import { Provide, Inject } from "@midwayjs/core";
import { UserService } from '@app/service/user.service';
import { OrderService } from '@app/service/order.service';

@Provide()
export class PrintNoticeBoardService {

    @Inject()
    userService: UserService;

    @Inject()
    orderService: OrderService;

    //浏览器获取cookie的方法 const a = encodeURL()

    // 校验cookie是否生效
    async checkCookie(mycookie?: string) {
        const formattedCookie = this.formatCookieString(mycookie);
        // 使用传入的 mycookie 进行验证
        const authResult = await this.fetchOrderCount(formattedCookie);
        
        return {
            success: authResult.authenticated,
            message: authResult.authenticated ? 'Cookie 验证成功' : 'Cookie 验证失败',
            data: authResult
        };
    }

    formatCookieString(cookie?: string) {
        const defaultCookie = 'ASP.NET_SessionId=ypzamokga2yhb04xsxiwnk5q; popTime=; popTimes=0; popData=; .iyint=7516B483EBD8FA7738ECBA632ADC77DCF7AFE1875731B243C819BC30EE053386BE08B29F05D60F4DC55113ABAA22B2B2B1DCBD0C6945A2BE0685709E7AC7F8A211B3917CC8B38EFA418AC1E717446108A10EF0A1AAB2E3AC0D90303F569EE5E5F66E8E49F04AFC0F692E0A6EC09F67D09CCC1E1B89D6F7EA3602DECCD7AABB24E6CB62B5102E0E14A5EE3CC3';
        const sanitize = (s?: string) => {
            if (!s) return '';
            let t = s.trim();
            // 如果外层被单/双引号包裹（例如 ?mycookie='xxx'）则去掉
            if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
                t = t.slice(1, -1).trim();
            }
            // 尝试解码 URL 编码的 cookie 值
            try { t = decodeURIComponent(t); } catch (e) { /* ignore */ }
            return t;
        };
        return sanitize(cookie) || defaultCookie;
    }

    // 初始化数据
    async initData(mycookie?: string) {
        // 第一步获取cookie中的信息
        const formattedCookie = this.formatCookieString(mycookie);
        console.log('接收到的 cookie:', formattedCookie);
        // 第二步初始化用户数据和订单数据
        const [res1, res2] = await Promise.all([this.initUserData(formattedCookie), this.initOrders(formattedCookie)]);
        return { users: res1, orders: res2 };
    }

    
    // 初始化/全量拉取用户数据，支持可选的开始/结束日期（格式: YY-MM-DD 或 YYYY-MM-DD）
    async initUserData(mycookie?: string, startDate?: string, endDate?: string) {
        const formattedCookie = this.formatCookieString(mycookie);
        // 遍历分页拉取（rows 每页大小），直到返回空或少于 rows
        const rowsPerPage = 200;
        let page = 1;
        let totalInserted = 0;
        const totalFailed: string[] = [];
        const fetchImpl: any = (globalThis as any).fetch;
        if (!fetchImpl) {
            throw new Error('当前运行环境缺少 fetch，请在 Node 18+ 运行或引入 fetch polyfill。');
        }

        while (true) {
          // 传入可选的 StartTime/EndTime 参数（API 期望 YYYY-MM-DD 或类似格式），注意做 URL 编码
          const startParam = startDate ? `&StartTime=${encodeURIComponent(startDate)}` : '';
          const endParam = endDate ? `&EndTime=${encodeURIComponent(endDate)}` : '';
          const url = this.getBaseUrl() + `Depot/member/ashx/ManageMembers.ashx?page=${page}&rows=${rowsPerPage}&action=getlist&UserName=&RealName=${startParam}${endParam}&GradeId=&RegisteredSource=&TagsId=&UserGroupType=&OrderBy=CreateDate`;
          const res = await fetchImpl(url, {
            method: 'GET',
            headers: {
              'Cookie': formattedCookie,
              'Accept': 'application/json, text/html, */*',
              'User-Agent': 'Mozilla/5.0',
              'Referer': this.getBaseUrl(),
            },
            redirect: 'follow',
          });

          const data = await this.readResponseAsJson(res);
          if (!data) break;

          let list: any[] = [];
          if (Array.isArray(data.rows)) list = data.rows;
          else if (Array.isArray(data.data)) list = data.data;
          else if (Array.isArray(data.List)) list = data.List;
          else if (Array.isArray(data.result)) list = data.result;
          else if (Array.isArray(data)) list = data;
          else if (data.Data && Array.isArray(data.Data.rows)) list = data.Data.rows;

          if (!list || list.length === 0) break;

          const { inserted, failed } = await this.userService.processRemoteUsers(list);
          totalInserted += inserted;
          totalFailed.push(...failed);

          if (list.length < rowsPerPage) break;
          page++;
        }

        return { inserted: totalInserted, failed: totalFailed };
    }

    // 每天更新数据
    async updateNoticeBoard(mycookie?: string) {
        // 第一步获取cookie中的信息
        const formattedCookie = this.formatCookieString(mycookie);
        console.log('接收到的 cookie:', formattedCookie);
        
        // 使用传入的 mycookie 进行验证
        const authResult = await this.fetchOrderCount(formattedCookie);
        
        return {
            success: authResult.authenticated,
            message: authResult.authenticated ? 'Cookie 验证成功' : 'Cookie 验证失败',
            data: authResult
        };
    }

    getBaseUrl(): string {
        return "https://youfan.iyint.com/";
    }

    // 读取 response 并尽可能解析为 JSON，返回原始文本或解析后的对象
    async readResponseAsJson(res: any): Promise<any> {
        if (!res) return null;
        const ct = (res.headers && res.headers.get) ? (res.headers.get('content-type') || '').toLowerCase() : '';
        try {
            if (ct.includes('application/json') || ct.includes('text/json')) {
                return await res.json();
            }
        } catch (e) {
            // fallthrough to text parsing
        }

        try {
            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                const first = text.indexOf('{');
                const last = text.lastIndexOf('}');
                if (first !== -1 && last !== -1) {
                    try { return JSON.parse(text.slice(first, last + 1)); } catch (e2) { /* ignore */ }
                }
                return text;
            }
        } catch (e) {
            return null;
        }
    }

    // 增量更新：从 lastSyncDate 开始拉取并插入/更新用户
    async updateIncremental(lastSyncDate?: string | Date, mycookie?: string) {
        const formattedCookie = this.formatCookieString(mycookie);
        const rowsPerPage = 200;
        let page = 1;
        let totalInserted = 0;
        const totalFailed: string[] = [];

        const startTime = (() => {
            if (!lastSyncDate) return '';
            const d = (lastSyncDate instanceof Date) ? lastSyncDate : new Date(String(lastSyncDate));
            if (isNaN(d.getTime())) return '';
            // API 可能只支持日期，使用 YYYY-MM-DD
            const y = d.getFullYear();
            const m = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            return `${y}-${m}-${day}`;
        })();

        const fetchImpl: any = (globalThis as any).fetch;
        if (!fetchImpl) {
            throw new Error('当前运行环境缺少 fetch，请在 Node 18+ 运行或引入 fetch polyfill。');
        }

        while (true) {
            const url = this.getBaseUrl() + `Depot/member/ashx/ManageMembers.ashx?page=${page}&rows=${rowsPerPage}&action=getlist&UserName=&RealName=&StartTime=${encodeURIComponent(startTime)}&EndTime=&GradeId=&RegisteredSource=&TagsId=&UserGroupType=&OrderBy=CreateDate`;
            const res = await fetchImpl(url, {
                method: 'GET',
                headers: {
                    'Cookie': formattedCookie,
                    'Accept': 'application/json, text/html, */*',
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': this.getBaseUrl(),
                },
                redirect: 'follow',
            });

            const data = await this.readResponseAsJson(res);
            if (!data) break;

            let list: any[] = [];
            if (Array.isArray(data.rows)) list = data.rows;
            else if (Array.isArray(data.data)) list = data.data;
            else if (Array.isArray(data.List)) list = data.List;
            else if (Array.isArray(data.result)) list = data.result;
            else if (Array.isArray(data)) list = data;
            else if (data.Data && Array.isArray(data.Data.rows)) list = data.Data.rows;

            if (!list || list.length === 0) break;

            const { inserted, failed } = await this.userService.processRemoteUsers(list);
            totalInserted += inserted;
            totalFailed.push(...failed);

            if (list.length < rowsPerPage) break;
            page++;
        }

        return { inserted: totalInserted, failed: totalFailed };
    }

    // 初始化订单：分页拉取并写入 t_order 表
    // 初始化/全量拉取订单数据，支持可选的开始/结束日期（格式: YY-MM-DD 或 YYYY-MM-DD）
    async initOrders(mycookie?: string, startDate?: string, endDate?: string) {
        const formattedCookie = this.formatCookieString(mycookie);

        // 远端实际支持每页 200 条数据，设置为 200 以保证分页正确
        const rowsPerPage = 200;
        let page = 1;
        let totalInserted = 0;
        const totalFailed: string[] = [];
        const fetchImpl: any = (globalThis as any).fetch;
        if (!fetchImpl) throw new Error('当前运行环境缺少 fetch，请在 Node 18+ 运行或引入 fetch polyfill。');

        while (true) {
            const startParam = startDate ? `&StartDate=${encodeURIComponent(startDate)}` : '';
            const endParam = endDate ? `&EndDate=${encodeURIComponent(endDate)}` : '';
            const url = this.getBaseUrl() + `Depot/print/ashx/MergeOrder.ashx?page=${page}&rows=${rowsPerPage}&action=getlist&userType=0${startParam}${endParam}&OrderStatus=100&PrintType=100&DeliveryType=100&StaffPrint=0`;
            console.log('Fetching orders from URL:', url);
            
            const res = await fetchImpl(url, { method: 'GET', headers: { 'Cookie': formattedCookie, 'Accept': 'application/json, text/html, */*', 'User-Agent': 'Mozilla/5.0', 'Referer': this.getBaseUrl() }, redirect: 'follow' });
            const data = await this.readResponseAsJson(res);
            if (!data) break;

            let list: any[] = [];
            if (Array.isArray(data.rows)) list = data.rows;
            else if (Array.isArray(data.data)) list = data.data;
            else if (Array.isArray(data.List)) list = data.List;
            else if (Array.isArray(data.result)) list = data.result;
            else if (Array.isArray(data)) list = data;
            else if (data.Data && Array.isArray(data.Data.rows)) list = data.Data.rows;

            if (!list || list.length === 0) break;

            const { inserted, failed } = await this.orderService.processRemoteOrders(list);
            totalInserted += inserted;
            totalFailed.push(...failed);

            // 同步每个订单的文件信息（并发控制）
            const mergeIds = list.map(it => it.MergeOrderId || it.mergeOrderId || it.merge_order_id || it.mergeOrderId || it.MergeOrderId).filter(Boolean);
            const concurrency = 5;
            for (let i = 0; i < mergeIds.length; i += concurrency) {
                const batch = mergeIds.slice(i, i + concurrency);
                await Promise.all(batch.map(mid => this.orderService.processAndSaveOrderFilesForMergeId(String(mid), formattedCookie).catch(() => ({ inserted: 0, failed: [String(mid)] }))));
            }

            // 如果返回中包含记录总数（例如 data.total），我们可以更准确地判断是否继续
            const totalCount = (data && (data.total || data.Total || data.count || data.records)) ? Number(data.total || data.Total || data.count || data.records) : null;
            if (totalCount && !isNaN(totalCount) && totalCount > 0) {
                const totalPages = Math.ceil(totalCount / rowsPerPage);
                if (page >= totalPages) break;
            } else {
                // 没有 total 信息时仍然使用 list.length 与 rowsPerPage 判断最后一页
                if (list.length < rowsPerPage) break;
            }
            page++;
        }

        return { inserted: totalInserted, failed: totalFailed };
    }

    // 订单增量更新：按 StartDate 拉取变更，并写入 t_order 表
    async updateOrdersIncremental(startDate?: string | Date, mycookie?: string) {
        const formattedCookie = this.formatCookieString(mycookie);
    // 增量更新使用每页 200 条（远端实际支持 200）
    const rowsPerPage = 200;
        let page = 1;
        let totalInserted = 0;
        const totalFailed: string[] = [];
        const fetchImpl: any = (globalThis as any).fetch;
        if (!fetchImpl) throw new Error('当前运行环境缺少 fetch，请在 Node 18+ 运行或引入 fetch polyfill。');

        const startStr = (() => {
            if (!startDate) return '';
            const d = (startDate instanceof Date) ? startDate : new Date(String(startDate));
            if (isNaN(d.getTime())) return '';
            const y = d.getFullYear();
            const m = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            return `${y}-${m}-${day}`;
        })();

        while (true) {
            const url = this.getBaseUrl() + `Depot/print/ashx/MergeOrder.ashx?page=${page}&rows=${rowsPerPage}&action=getlist&userType=0&StartDate=${encodeURIComponent(startStr)}&EndDate=&OrderStatus=100&PrintType=100&DeliveryType=100&StaffPrint=0`;
            const res = await fetchImpl(url, { method: 'GET', headers: { 'Cookie': formattedCookie, 'Accept': 'application/json, text/html, */*', 'User-Agent': 'Mozilla/5.0', 'Referer': this.getBaseUrl() }, redirect: 'follow' });
            const data = await this.readResponseAsJson(res);
            if (!data) break;

            let list: any[] = [];
            if (Array.isArray(data.rows)) list = data.rows;
            else if (Array.isArray(data.data)) list = data.data;
            else if (Array.isArray(data.List)) list = data.List;
            else if (Array.isArray(data.result)) list = data.result;
            else if (Array.isArray(data)) list = data;
            else if (data.Data && Array.isArray(data.Data.rows)) list = data.Data.rows;

            if (!list || list.length === 0) break;

            const { inserted, failed } = await this.orderService.processRemoteOrders(list);
            totalInserted += inserted;
            totalFailed.push(...failed);

            if (list.length < rowsPerPage) break;
            page++;
        }

        return { inserted: totalInserted, failed: totalFailed };
    }

    // 获取用户列表
    async getUserList(cookie?: string): Promise<any> {
    }


    async fetchOrderCount(cookie?: string): Promise<any> {
        const url = 'https://youfan.iyint.com/depot/Statistics.ashx?action=GetOrderCount&ConsumeTime=inOneWeek';
        
    
        const fetchImpl: any = (globalThis as any).fetch;
        if (!fetchImpl) {
            throw new Error('当前运行环境缺少 fetch，请在 Node 18+ 运行或引入 fetch polyfill。');
        }

        const res = await fetchImpl(url, {
            method: 'GET',
            headers: {
                'Cookie': cookie,
                'Accept': 'application/json, text/html, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Referer': 'https://youfan.iyint.com/',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'X-Requested-With': 'XMLHttpRequest',
                'Connection': 'keep-alive',
            },
            redirect: 'manual',
            cache: 'no-store',
        });

        const status = res.status;
        const location = res.headers.get('location');
        const ct = res.headers.get('content-type') || null;
        let body = '';
        try { body = await res.text(); } catch {}

        const redirectedLooksLikeLogin = !!location && /login|sign|account/i.test(location);
        const htmlLooksLikeLogin = (ct || '').includes('text/html') && /登录|login|sign in|账号|密码/i.test(body);
        const authenticated = res.ok && !redirectedLooksLikeLogin && !htmlLooksLikeLogin && status !== 401 && status !== 403;

        return {
            authenticated,
            status,
            redirectedTo: location,
            contentType: ct,
            snippet: (body || '').slice(0, 200),
        };
    }

    async getMsg(): Promise<string> {
        return "Hello from TestService";
        
    }
}