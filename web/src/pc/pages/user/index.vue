<template>
  <div class="page-user">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
        </div>
      </template>
    <el-form :inline="true" class="filter-form">
      <el-form-item label="用户ID">
        <el-input v-model="userId" placeholder="用户ID" clearable style="width: 150px;" />
      </el-form-item>
      <el-form-item label="注册时间">
        <el-date-picker
          v-model="regDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 260px;"
        />
      </el-form-item>
      <el-form-item label="首次下单时间">
        <el-date-picker
          v-model="firstOrderDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 260px;"
        />
      </el-form-item>
      <el-form-item label="是否有首次下单">
        <el-select v-model="hasFirstOrder" placeholder="全部" clearable style="width: 120px;">
          <el-option label="全部" value="" />
          <el-option label="有" value="1" />
          <el-option label="无" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchData(1)">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" border style="width: 100%">
      <el-table-column type="index" label="序号" width="80" :index="indexMethod" />
      <el-table-column prop="user_id" label="用户ID" width="150" />
      <el-table-column prop="user_name" label="用户名" width="150" />
      <el-table-column prop="cell_phone" label="手机号" width="130">
        <template #default="{ row }">
          {{ row.cell_phone || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="register_date" label="注册时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.register_date) || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="first_order_date" label="首次下单时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.first_order_date) || '-' }}
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchAPI } from '@/base/api';

const list = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 筛选条件
const userId = ref('');
const regDateRange = ref<[string, string] | null>(null);
const firstOrderDateRange = ref<[string, string] | null>(null);
const hasFirstOrder = ref('');

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

function indexMethod(index: number) {
  return (page.value - 1) * pageSize.value + index + 1;
}

async function fetchData(p = page.value) {
  page.value = p;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    
    if (userId.value) params.userId = userId.value;
    if (regDateRange.value && regDateRange.value.length === 2) {
      params.regStart = regDateRange.value[0];
      params.regEnd = regDateRange.value[1];
    }
    if (firstOrderDateRange.value && firstOrderDateRange.value.length === 2) {
      params.firstOrderStart = firstOrderDateRange.value[0];
      params.firstOrderEnd = firstOrderDateRange.value[1];
    }
    if (hasFirstOrder.value) params.hasFirstOrder = hasFirstOrder.value;
    
    const result = await fetchAPI('/api/user/getUserList', params);
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

function resetFilters() {
  userId.value = '';
  regDateRange.value = null;
  firstOrderDateRange.value = null;
  hasFirstOrder.value = '';
  fetchData(1);
}

onMounted(() => fetchData(1));
</script>

<style scoped>
.page-user {
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
