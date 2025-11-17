<template>
  <div class="page-order-summary">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单汇总统计</span>
        </div>
      </template>

      <el-form :inline="true" class="filter-form">
        <el-form-item label="统计时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 300px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetToCurrentMonth">重置为当月</el-button>
        </el-form-item>
      </el-form>

      <div class="summary-info">
        <el-tag type="info">统计时间: {{ startDate }} 至 {{ endDate }}</el-tag>
        <el-tag type="success" style="margin-left: 16px;">
          总订单量: {{ totalOrderCount }}
        </el-tag>
        <el-tag type="warning" style="margin-left: 16px;">
          总金额: ¥{{ totalAmount.toFixed(2) }}
        </el-tag>
      </div>

      <el-table 
        :data="list" 
        border 
        style="width: 100%; margin-top: 16px;" 
        :summary-method="getSummaries" 
        show-summary
        :default-sort="{ prop: 'order_count', order: 'descending' }"
      >
        <el-table-column prop="address_num" label="地址编码" width="100" align="center" sortable />
        <el-table-column prop="address_name" label="地址名称" width="150" />
        <el-table-column prop="order_count" label="订单数量" width="120" align="center" sortable>
          <template #default="{ row }">
            <el-tag>{{ row.order_count }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="总金额" width="150" align="right" sortable>
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ formatPrice(row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="avg_amount" label="平均金额" width="150" align="right" sortable>
          <template #default="{ row }">
            ¥{{ formatPrice(row.avg_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="percentage" label="占比" width="120" align="center" sortable>
          <template #default="{ row }">
            {{ row.percentage }}%
          </template>
        </el-table-column>
        <el-table-column label="进度" min-width="200">
          <template #default="{ row }">
            <el-progress :percentage="parseFloat(row.percentage)" :color="getProgressColor(row.percentage)" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { fetchAPI } from '@/base/api';

// 地址编码映射
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
const dateRange = ref<[string, string] | null>(null);
const startDate = ref('');
const endDate = ref('');

// 获取当月第一天和最后一天
function getCurrentMonthRange(): [string, string] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  
  return [formatDate(firstDay), formatDate(lastDay)];
}

// 计算总订单量
const totalOrderCount = computed(() => {
  return list.value.reduce((sum, item) => sum + item.order_count, 0);
});

// 计算总金额
const totalAmount = computed(() => {
  return list.value.reduce((sum, item) => sum + item.total_amount, 0);
});

function formatPrice(price?: number | string) {
  const num = Number(price);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

function getProgressColor(percentage: string) {
  const p = parseFloat(percentage);
  if (p < 5) return '#909399';
  if (p < 10) return '#67c23a';
  if (p < 20) return '#e6a23c';
  return '#f56c6c';
}

function getSummaries(param: any) {
  const { columns } = param;
  const sums: string[] = [];
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = '合计';
      return;
    }
    if (index === 1) {
      sums[index] = '';
      return;
    }
    if (index === 2) {
      sums[index] = String(totalOrderCount.value);
      return;
    }
    if (index === 3) {
      sums[index] = '¥' + totalAmount.value.toFixed(2);
      return;
    }
    if (index === 4) {
      const avg = totalOrderCount.value > 0 ? totalAmount.value / totalOrderCount.value : 0;
      sums[index] = '¥' + avg.toFixed(2);
      return;
    }
    sums[index] = '';
  });
  return sums;
}

async function fetchData() {
  try {
    const params: any = {};
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    
    const result = await fetchAPI('/api/order/getOrderSummary', params);
    if (result && result.data) {
      startDate.value = result.startDate;
      endDate.value = result.endDate;
      
      const total = result.data.reduce((sum: number, item: any) => sum + item.total_amount, 0);
      
      list.value = result.data.map((item: any) => {
        const address_num = item.address_num;
        const address_name = addressOptions[address_num] || '未知';
        const avg_amount = item.order_count > 0 ? item.total_amount / item.order_count : 0;
        const percentage = total > 0 ? ((item.total_amount / total) * 100).toFixed(2) : '0.00';
        
        return {
          address_num,
          address_name,
          order_count: item.order_count,
          total_amount: item.total_amount,
          avg_amount,
          percentage,
        };
      });
    } else {
      list.value = [];
    }
  } catch (e) {
    console.error('获取订单汇总失败:', e);
    list.value = [];
  }
}

function resetToCurrentMonth() {
  const [start, end] = getCurrentMonthRange();
  dateRange.value = [start, end];
  fetchData();
}

onMounted(() => {
  const [start, end] = getCurrentMonthRange();
  dateRange.value = [start, end];
  fetchData();
});
</script>

<style scoped>
.page-order-summary {
  padding: 20px;
}
.card-header {
  font-size: 18px;
  font-weight: 500;
}
.filter-form {
  margin-bottom: 16px;
}
.summary-info {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>
