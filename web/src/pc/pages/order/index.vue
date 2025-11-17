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
      </el-form-item>
    </el-form>

    <el-table :data="list" border style="width: 100%">
      <el-table-column type="index" label="序号" width="70" :index="indexMethod" />
      <el-table-column prop="merge_order_id" label="合并订单ID" width="160" />
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
          ¥{{ formatPrice(row.actual_pay_price) }}
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
      <el-table-column prop="remark" label="备注" min-width="150">
        <template #default="{ row }">
          {{ row.remark || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="showDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

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
const payDateRange = ref<[string, string] | null>(null);
const detailVisible = ref(false);
const currentOrder = ref<any>(null);
const orderFiles = ref<any[]>([]);
const filesLoading = ref(false);

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
        orderFiles.value = result.data;
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
    if (payDateRange.value && payDateRange.value.length === 2) {
      params.payStart = payDateRange.value[0];
      params.payEnd = payDateRange.value[1];
    }
    const result = await fetchAPI('/api/order/getOrderList', params);
    if (result && result.data) {
      list.value = result.data;
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
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
