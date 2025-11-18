<template>
    <div class="home-page">
       <el-card>
         <template #header>
           <div class="card-header">
             <span>欢迎使用打印通知板管理系统</span>
           </div>
         </template>
         <el-row :gutter="20">
           <el-col :span="8">
             <el-card shadow="hover" class="quick-link">
               <router-link to="/users" class="link-content">
                 <div class="icon">👤</div>
                 <div class="title">用户管理</div>
                 <div class="desc">管理系统用户信息</div>
               </router-link>
             </el-card>
           </el-col>
           <el-col :span="8">
             <el-card shadow="hover" class="quick-link">
               <router-link to="/orders" class="link-content">
                 <div class="icon">📄</div>
                 <div class="title">订单管理</div>
                 <div class="desc">查看和管理订单信息</div>
               </router-link>
             </el-card>
           </el-col>
           <el-col :span="8">
             <el-card shadow="hover" class="quick-link">
               <router-link to="/order-summary" class="link-content">
                 <div class="icon">📊</div>
                 <div class="title">订单汇总</div>
                 <div class="desc">按地址统计订单数据</div>
               </router-link>
             </el-card>
           </el-col>
         </el-row>
         <el-row :gutter="20" style="margin-top: 20px;">
           <el-col :span="8">
             <el-card shadow="hover" class="quick-link">
               <router-link to="/order-chart" class="link-content">
                 <div class="icon">📈</div>
                 <div class="title">时段分析</div>
                 <div class="desc">查看24小时订单分布</div>
               </router-link>
             </el-card>
           </el-col>
         </el-row>
       </el-card>
    </div>
</template><script setup lang="ts" name="Home">
import { computed, reactive } from 'vue';
const props = defineProps({});
const currentMusician = reactive({
    url: '',
});

</script>

<style lang="scss" scoped>
.home-page {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: 500;
}

.quick-link {
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
  }
}

.link-content {
  display: block;
  text-align: center;
  text-decoration: none;
  color: inherit;
  
  .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .title {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 8px;
    color: #333;
  }
  
  .desc {
    font-size: 14px;
    color: #666;
  }
}
</style>