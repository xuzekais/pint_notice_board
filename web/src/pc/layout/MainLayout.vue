<template>
  <div class="app-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px" class="sidebar">
        <div class="logo">打印通知板</div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#001529"
          text-color="#fff"
          active-text-color="#1890ff"
        >
          <el-menu-item index="/home">
            <span>🏠 首页</span>
          </el-menu-item>
          <el-menu-item index="/users">
            <span>👤 用户列表</span>
          </el-menu-item>
          <el-menu-item index="/orders">
            <span>📄 订单列表</span>
          </el-menu-item>
          <el-menu-item index="/order-summary">
            <span>📊 订单汇总</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <!-- 顶部导航 -->
        <el-header class="header">
          <div class="header-left">
            <span class="breadcrumb">{{ pageTitle }}</span>
          </div>
          <div class="header-right">
            <span class="user-info">管理员</span>
          </div>
        </el-header>

        <!-- 主内容区 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeMenu = computed(() => route.path);

const pageTitle = computed(() => {
  const titleMap: Record<string, string> = {
    '/home': '首页',
    '/users': '用户管理',
    '/orders': '订单管理',
    '/order-summary': '订单汇总统计',
  };
  return titleMap[route.path] || '打印通知板';
});
</script>

<style scoped>
.app-layout {
  height: 100vh;
  width: 100%;
}

.el-container {
  height: 100%;
}

.sidebar {
  background-color: #001529;
  height: 100vh;
  overflow-y: auto;
}

.logo {
  height: 64px;
  line-height: 64px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #002140;
}

.el-menu {
  border-right: none;
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.breadcrumb {
  font-size: 16px;
  font-weight: 500;
}

.user-info {
  color: #666;
}

.main-content {
  background-color: #f0f2f5;
  overflow-y: auto;
}
</style>
