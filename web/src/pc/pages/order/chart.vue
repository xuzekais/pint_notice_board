<template>
  <div class="page-order-chart">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单时段分析</span>
        </div>
      </template>

      <el-form :inline="true" class="filter-form">
        <el-form-item label="地址编码">
          <el-select v-model="addressNum" placeholder="全部地址" clearable style="width: 200px;">
            <el-option label="全部地址" value="" />
            <el-option
              v-for="(label, code) in addressOptions"
              :key="code"
              :label="`${code} - ${label}`"
              :value="String(code)"
            />
          </el-select>
        </el-form-item>
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
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="chart-info">
        <el-tag type="info">统计时间: {{ startDate }} 至 {{ endDate }}</el-tag>
        <el-tag type="success" style="margin-left: 16px;">
          地址: {{ getAddressLabel() }}
        </el-tag>
        <el-tag type="warning" style="margin-left: 16px;">
          总订单量: {{ totalOrders }}
        </el-tag>
      </div>

      <div ref="chartRef" class="chart-container" v-loading="loading"></div>

      <el-divider>数据详情</el-divider>

      <el-table :data="tableData" border style="width: 100%">
        <el-table-column prop="hour" label="时段" width="120" align="center">
          <template #default="{ row }">
            {{ row.hour }}:00 - {{ row.hour }}:59
          </template>
        </el-table-column>
        <el-table-column prop="order_count" label="订单数量" align="center">
          <template #default="{ row }">
            <el-tag :type="getTagType(row.order_count)">{{ row.order_count }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="percentage" label="占比" width="150" align="center">
          <template #default="{ row }">
            {{ row.percentage }}%
          </template>
        </el-table-column>
        <el-table-column label="进度" width="300">
          <template #default="{ row }">
            <el-progress :percentage="parseFloat(row.percentage)" :color="getProgressColor(row.order_count)" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { fetchAPI } from '@/base/api';
import * as echarts from 'echarts';

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

const chartRef = ref<HTMLDivElement>();
const addressNum = ref('');
const dateRange = ref<[string, string] | null>(null);
const startDate = ref('');
const endDate = ref('');
const loading = ref(false);
const chartData = ref<any[]>([]);

let chartInstance: echarts.ECharts | null = null;

// 获取最近30天的日期范围
function getLast30DaysRange(): [string, string] {
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  return [startDate, endDate];
}

const totalOrders = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.order_count, 0);
});

const tableData = computed(() => {
  const total = totalOrders.value;
  return chartData.value.map(item => ({
    ...item,
    percentage: total > 0 ? ((item.order_count / total) * 100).toFixed(2) : '0.00',
  }));
});

function getAddressLabel() {
  if (!addressNum.value) return '全部地址';
  const code = Number(addressNum.value);
  return addressOptions[code] ? `${code} - ${addressOptions[code]}` : addressNum.value;
}

function getTagType(count: number) {
  if (count === 0) return 'info';
  if (count < 10) return '';
  if (count < 50) return 'success';
  if (count < 100) return 'warning';
  return 'danger';
}

function getProgressColor(count: number) {
  if (count < 10) return '#909399';
  if (count < 50) return '#67c23a';
  if (count < 100) return '#e6a23c';
  return '#f56c6c';
}

function initChart() {
  if (!chartRef.value) return;
  
  if (chartInstance) {
    chartInstance.dispose();
  }
  
  chartInstance = echarts.init(chartRef.value);
  
  const option: echarts.EChartsOption = {
    title: {
      text: '24小时订单分布',
      left: 'center',
      top: 10,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}:00 - ${data.name}:59<br/>订单数量: ${data.value}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '80px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => i),
      name: '小时',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        formatter: '{value}:00',
      },
    },
    yAxis: {
      type: 'value',
      name: '订单数量',
      minInterval: 1,
    },
    series: [
      {
        name: '订单数量',
        type: 'bar',
        data: [],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' },
          ]),
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2378f7' },
              { offset: 0.7, color: '#2378f7' },
              { offset: 1, color: '#83bff6' },
            ]),
          },
        },
      },
    ],
  };
  
  chartInstance.setOption(option);
}

function updateChart() {
  if (!chartInstance) return;
  
  const data = chartData.value.map(item => item.order_count);
  
  chartInstance.setOption({
    series: [
      {
        data,
      },
    ],
  });
}

async function fetchData() {
  loading.value = true;
  try {
    const params: any = {};
    if (addressNum.value) params.addressNum = addressNum.value;
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    
    const result = await fetchAPI('/api/order/getOrderHourlyStats', params);
    if (result && result.data) {
      startDate.value = result.startDate;
      endDate.value = result.endDate;
      chartData.value = result.data;
      updateChart();
    } else {
      chartData.value = [];
    }
  } catch (e) {
    console.error('获取订单时段统计失败:', e);
    chartData.value = [];
  } finally {
    loading.value = false;
  }
}

function resetFilter() {
  addressNum.value = '';
  const [start, end] = getLast30DaysRange();
  dateRange.value = [start, end];
  fetchData();
}

onMounted(() => {
  const [start, end] = getLast30DaysRange();
  dateRange.value = [start, end];
  
  initChart();
  fetchData();
  
  // 监听窗口大小变化，自动调整图表大小
  window.addEventListener('resize', () => {
    chartInstance?.resize();
  });
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<style scoped>
.page-order-chart {
  padding: 20px;
}
.card-header {
  font-size: 18px;
  font-weight: 500;
}
.filter-form {
  margin-bottom: 16px;
}
.chart-info {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
.chart-container {
  width: 100%;
  height: 400px;
  margin-bottom: 20px;
}
</style>
