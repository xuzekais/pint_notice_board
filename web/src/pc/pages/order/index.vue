<template>
  <div class="page-order">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
        </div>
      </template>
    <el-form :inline="true" class="filter-form">
      <el-form-item label="合并订单号">
        <el-input v-model="mergeOrderId" placeholder="订单号" clearable style="width: 180px;" />
      </el-form-item>
      <el-form-item label="用户ID">
        <el-input v-model="userId" placeholder="用户ID" clearable style="width: 120px;" />
      </el-form-item>
      <el-form-item label="订单类型">
        <el-input v-model="orderType" placeholder="订单类型" clearable style="width: 120px;" />
      </el-form-item>
      <el-form-item label="地址编码">
        <el-select v-model="addressNum" placeholder="选择地址" clearable style="width: 150px;">
          <el-option
            v-for="(label, code) in addressOptions"
            :key="code"
            :label="`${code} - ${label}`"
            :value="code"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="文档名称">
        <el-input v-model="fileName" placeholder="文档名称" clearable style="width: 200px;" />
      </el-form-item>
      <el-form-item label="支付时间">
        <el-date-picker
          v-model="payDateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchData(1)">查询</el-button>
        <el-button type="success" @click="exportAllOrders" :loading="exporting">导出全部订单</el-button>
      </el-form-item>
    </el-form>

    <div class="table-container">
      <el-table 
        :data="list" 
        border 
        style="width: 100%"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
      >
        <el-table-column label="订单编号" width="280" fixed="left">
          <template #default="{ row }">
            <span v-if="!row.order_no">{{ row.merge_order_id }}</span>
            <el-tag v-else size="small" type="info">{{ row.order_no }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user_name" label="用户昵称" width="120">
          <template #default="{ row }">
            {{ row.user_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="take_code" label="取件码" width="100">
          <template #default="{ row }">
            {{ row.take_code || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="pay_date" label="支付时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.pay_date) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="actual_pay_price" label="实付金额" width="100">
          <template #default="{ row }">
            <span v-if="row.actual_pay_price !== undefined">¥{{ formatPrice(row.actual_pay_price) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="order_status" label="订单状态" width="100">
          <template #default="{ row }">
            {{ getOrderStatus(row.order_status) }}
          </template>
        </el-table-column>
        <el-table-column prop="cell_phone" label="联系电话" width="120">
          <template #default="{ row }">
            {{ row.cell_phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="address_detail" label="地址详情" width="200">
          <template #default="{ row }">
            {{ row.address_detail || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="150">
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="文档名称" width="200">
          <template #default="{ row }">
            <span v-if="row.file_name">{{ row.file_name }}</span>
            <span v-else-if="row.summary_file_names">{{ row.summary_file_names }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="文档类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" v-if="row.file_type">{{ row.file_type }}</el-tag>
            <span v-else-if="row.summary_file_types">{{ row.summary_file_types }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="打印页数" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.print_pages !== undefined">{{ row.print_pages }}</span>
            <span v-else-if="row.summary_print_pages !== undefined">{{ row.summary_print_pages }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="纸张" width="100">
          <template #default="{ row }">
            <span v-if="row.paper_kind">{{ row.paper_kind }}</span>
            <span v-else-if="row.summary_paper_kinds">{{ row.summary_paper_kinds }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="颜色" width="100">
          <template #default="{ row }">
            <span v-if="row.color">{{ row.color }}</span>
            <span v-else-if="row.summary_colors">{{ row.summary_colors }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="单双面" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.duplex !== undefined">{{ row.duplex ? '双面' : '单面' }}</span>
            <span v-else-if="row.summary_duplex">{{ row.summary_duplex }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="900px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="合并订单ID">{{ currentOrder.merge_order_id }}</el-descriptions-item>
        <el-descriptions-item label="用户昵称">{{ currentOrder.user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="取件码">{{ currentOrder.take_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatDate(currentOrder.pay_date) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="实付金额">¥{{ formatPrice(currentOrder.actual_pay_price) }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">{{ getOrderStatus(currentOrder.order_status) }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentOrder.cell_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址编码">{{ getAddressLabel(currentOrder.address_num) }}</el-descriptions-item>
        <el-descriptions-item label="地址详情" :span="2">{{ currentOrder.address_detail || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>子订单信息</el-divider>
      
      <el-table :data="orderFiles" border style="width: 100%; margin-top: 16px;" v-loading="filesLoading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="order_no" label="子订单号" width="140">
          <template #default="{ row }">
            {{ row.order_no || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="file_name" label="文档名称" min-width="150">
          <template #default="{ row }">
            {{ row.file_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="file_type" label="文档类型" width="90">
          <template #default="{ row }">
            {{ row.file_type || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="print_pages" label="打印页数" width="90" align="center" />
        <el-table-column prop="paper_kind" label="纸张" width="80">
          <template #default="{ row }">
            {{ row.paper_kind || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="color" label="颜色" width="80">
          <template #default="{ row }">
            {{ row.color || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="duplex" label="单双面" width="80" align="center">
          <template #default="{ row }">
            {{ row.duplex ? '双面' : '单面' }}
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchAPI } from '@/base/api';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx';

// 地址编码映射（从后端枚举同步）
const addressOptions: Record<number, string> = {
  1: '图书馆',
  2: '科技楼B',
  3: '15栋',
  4: '6栋',
  5: '2栋',
  6: '1栋',
  7: '24栋',
  8: '3栋',
  9: '5栋',
  10: '7栋',
  11: '8栋',
  12: '12栋',
  13: '9栋',
  14: '10栋',
  15: '11栋',
  16: '20栋',
  17: '21栋',
  18: '22栋',
  19: '17栋',
  20: '16栋',
  21: '23栋',
  22: '18栋',
  23: '19栋',
  24: '25栋',
  25: '26栋',
  26: '化工楼',
  27: '服装楼',
  28: '田家炳',
  29: '旭日楼',
  30: '行政楼',
  31: '电子楼',
  32: '音乐楼',
  33: '实训楼',
  34: '北苑',
  35: '其他',
};

const list = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const mergeOrderId = ref('');
const userId = ref('');
const orderType = ref('');
const addressNum = ref('');
const fileName = ref('');
const payDateRange = ref<[string, string] | null>(null);
const detailVisible = ref(false);
const currentOrder = ref<any>(null);
const orderFiles = ref<any[]>([]);
const filesLoading = ref(false);
const exporting = ref(false);

function formatDate(s?: string | Date) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s.toString();
  return d.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatPrice(price?: number | string) {
  const num = Number(price);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

function indexMethod(index: number) {
  return (page.value - 1) * pageSize.value + index + 1;
}

function getAddressLabel(code?: number | string): string {
  if (!code) return '-';
  const num = typeof code === 'string' ? parseInt(code) : code;
  return addressOptions[num] ? `${num} - ${addressOptions[num]}` : String(code);
}

function getOrderStatus(status?: number): string {
  const statusMap: Record<number, string> = {
    0: '待支付',
    1: '已支付',
    2: '已完成',
    3: '已取消',
  };
  return status != null ? statusMap[status] || '未知' : '-';
}

async function showDetail(row: any) {
  currentOrder.value = row;
  orderFiles.value = [];
  detailVisible.value = true;
  
  // 加载子订单信息
  if (row.merge_order_id) {
    filesLoading.value = true;
    try {
      const result = await fetchAPI('/api/order/getOrderFiles', { mergeOrderId: row.merge_order_id });
      if (result && result.data) {
        // 如果 file_type 为空，从 file_name 提取文件后缀
        orderFiles.value = result.data.map((file: any) => {
          let fileType = file.file_type;
          if (!fileType && file.file_name) {
            const lastDot = file.file_name.lastIndexOf('.');
            if (lastDot > 0 && lastDot < file.file_name.length - 1) {
              fileType = file.file_name.substring(lastDot + 1).toLowerCase();
            }
          }
          return { ...file, file_type: fileType };
        });
      }
    } catch (e) {
      console.error('加载子订单失败:', e);
    } finally {
      filesLoading.value = false;
    }
  }
}

async function fetchData(p = page.value) {
  page.value = p;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (mergeOrderId.value) params.mergeOrderId = mergeOrderId.value;
    if (userId.value) params.userId = userId.value;
    if (orderType.value) params.orderType = orderType.value;
    if (addressNum.value) params.addressNum = addressNum.value;
    if (fileName.value) params.fileName = fileName.value;
    if (payDateRange.value && payDateRange.value.length === 2) {
      params.payStart = payDateRange.value[0];
      params.payEnd = payDateRange.value[1];
    }
    const result = await fetchAPI('/api/order/getOrderList', params);
    if (result && result.data) {
      // 为每个订单和子订单添加唯一 id，用于 row-key
      list.value = result.data.map((order: any, index: number) => {
        const parentId = `order_${index}_${order.merge_order_id}`;
        const children = order.children?.map((child: any, childIndex: number) => ({
          ...child,
          id: `${parentId}_child_${childIndex}_${child.id}`,
        })) || [];
        
        // 计算总订单的汇总数据（从子订单聚合）
        const summary_file_names = children.map((c: any) => c.file_name).filter(Boolean).join(', ');
        const summary_file_types = [...new Set(children.map((c: any) => c.file_type).filter(Boolean))].join(', ');
        const summary_print_pages = children.reduce((sum: number, c: any) => sum + (Number(c.print_pages) || 0), 0);
        const summary_paper_kinds = [...new Set(children.map((c: any) => c.paper_kind).filter(Boolean))].join(', ');
        const summary_colors = [...new Set(children.map((c: any) => c.color).filter(Boolean))].join(', ');
        const summary_duplex = [...new Set(children.map((c: any) => c.duplex ? '双面' : '单面'))].join(', ');

        return {
          ...order,
          id: parentId,
          hasChildren: children.length > 0,
          children,
          summary_file_names,
          summary_file_types,
          summary_print_pages,
          summary_paper_kinds,
          summary_colors,
          summary_duplex
        };
      });
      total.value = Number(result.total) || 0;
    } else {
      list.value = [];
      total.value = 0;
    }
  } catch (e) {
    console.error(e);
    list.value = [];
    total.value = 0;
  }
}

function handlePageChange(newPage: number) {
  fetchData(newPage);
}

function handleSizeChange(newSize: number) {
  pageSize.value = newSize;
  fetchData(1);
}

async function exportAllOrders() {
  exporting.value = true;
  try {
    // 构建查询参数（不包含分页，获取所有数据）
    const params: any = {};
    if (mergeOrderId.value) params.mergeOrderId = mergeOrderId.value;
    if (userId.value) params.userId = userId.value;
    if (orderType.value) params.orderType = orderType.value;
    if (addressNum.value) params.addressNum = addressNum.value;
    if (fileName.value) params.fileName = fileName.value;
    if (payDateRange.value && payDateRange.value.length === 2) {
      params.payStart = payDateRange.value[0];
      params.payEnd = payDateRange.value[1];
    }

    const result = await fetchAPI('/api/order/getOrderList', params);
    
    if (!result || !result.data || result.data.length === 0) {
      ElMessage.warning('没有数据可导出');
      return;
    }

    // 准备导出数据 - 展开所有订单和子订单
    const exportData: any[] = [];
    
    result.data.forEach((order: any) => {
      if (order.children && order.children.length > 0) {
        // 有子订单，展开每个子订单
        order.children.forEach((child: any) => {
          exportData.push({
            '合并订单号': order.merge_order_id || '',
            '子订单号': child.order_no || '',
            '用户昵称': order.user_name || '',
            '用户ID': order.user_id || '',
            '取件码': order.take_code || '',
            '支付时间': formatDateForExport(order.pay_date),
            '实付金额': order.actual_pay_price || 0,
            '订单状态': getOrderStatus(order.order_status),
            '联系电话': order.cell_phone || '',
            '地址编码': order.address_num ? `${order.address_num} - ${addressOptions[order.address_num] || ''}` : '',
            '地址详情': order.address_detail || '',
            '备注': order.remark || '',
            '文档名称': child.file_name || '',
            '文档类型': child.file_type || '',
            '打印页数': child.print_pages || 0,
            '纸张': child.paper_kind || '',
            '颜色': child.color || '',
            '单双面': child.duplex ? '双面' : '单面',
          });
        });
      } else {
        // 没有子订单，只导出主订单信息
        exportData.push({
          '合并订单号': order.merge_order_id || '',
          '子订单号': '',
          '用户昵称': order.user_name || '',
          '用户ID': order.user_id || '',
          '取件码': order.take_code || '',
          '支付时间': formatDateForExport(order.pay_date),
          '实付金额': order.actual_pay_price || 0,
          '订单状态': getOrderStatus(order.order_status),
          '联系电话': order.cell_phone || '',
          '地址编码': order.address_num ? `${order.address_num} - ${addressOptions[order.address_num] || ''}` : '',
          '地址详情': order.address_detail || '',
          '备注': order.remark || '',
          '文档名称': '',
          '文档类型': '',
          '打印页数': 0,
          '纸张': '',
          '颜色': '',
          '单双面': '',
        });
      }
    });

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 20 }, // 合并订单号
      { wch: 15 }, // 子订单号
      { wch: 12 }, // 用户昵称
      { wch: 10 }, // 用户ID
      { wch: 10 }, // 取件码
      { wch: 18 }, // 支付时间
      { wch: 10 }, // 实付金额
      { wch: 10 }, // 订单状态
      { wch: 12 }, // 联系电话
      { wch: 20 }, // 地址编码
      { wch: 30 }, // 地址详情
      { wch: 20 }, // 备注
      { wch: 30 }, // 文档名称
      { wch: 10 }, // 文档类型
      { wch: 10 }, // 打印页数
      { wch: 10 }, // 纸张
      { wch: 10 }, // 颜色
      { wch: 10 }, // 单双面
    ];

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '订单列表');

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `订单列表_${timestamp}.xlsx`;

    // 下载
    XLSX.writeFile(wb, filename);
    
    ElMessage.success(`成功导出 ${exportData.length} 条记录`);
  } catch (e) {
    console.error('导出失败:', e);
    ElMessage.error('导出失败，请重试');
  } finally {
    exporting.value = false;
  }
}

function formatDateForExport(dateStr?: string | Date) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

onMounted(() => fetchData(1));
</script>

<style scoped>
.page-order {
  padding: 20px;
}
.card-header {
  font-size: 18px;
  font-weight: 500;
}
.filter-form {
  margin-bottom: 16px;
}
.table-container {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 16px;
}
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
