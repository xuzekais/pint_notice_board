import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

//  菜单栏路由
export const asyncRoutes = [];

export const constantRoutes: Array<RouteRecordRaw> = [
    // {
    //     path: '/redirect',
    //     meta: { hidden: true },
    //     children: [
    //         {
    //             path: '/redirect/:path(.*)',
    //             component: () => import('@/pc/pages/redirect/index.vue')
    //         }
    //     ]
    // },
    
    //设置兜底路由
    {
        path: '/',
        component: () => import('@/pc/layout/MainLayout.vue'),
        redirect: '/home',
        children: [
            {
                path: '/home',
                component: () => import('@/pc/pages/home/index.vue')
            },
            {
                path: '/users',
                component: () => import('@/pc/pages/user/index.vue')
            },
            {
                path: '/orders',
                component: () => import('@/pc/pages/order/index.vue')
            },
            {
                path: '/order-summary',
                component: () => import('@/pc/pages/order/summary.vue')
            }
        ]
    },
    {
        path: '/:w+',
        redirect: {
            path: '/404',
        },
    },
    {
        path: '/404',
        component: () => import('@/pc/pages/404.vue'),
        meta: { hidden: true }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes: constantRoutes,
});

export function resetRouter() {
    const newRouter = router;
    (router as any).matcher = (newRouter as any).matcher
}

export default router;
