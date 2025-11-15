import { Job, IJob } from '@midwayjs/cron';
import { FORMAT } from '@midwayjs/core';
@Job({
  cronTime: FORMAT.CRONTAB.EVERY_PER_5_MINUTE, // 每五分钟执行一次
  start: true, // 自动启动
})
export class DataSyncJob implements IJob {

  async onTick() {
    console.log('定时任务触发五分钟一次');
    // await this.updateProxyPoolService.updateProxyPool();

    // 更新一下代理池
    // await this.updateProxyPoolService.updateProxyPool();
    // this.apiService.fetchAllOrderTakers().then(response => {
    //   if (response.success) {
    //     console.log('成功获取币安数据:', response.data);
    //   } else {
    //     console.error('获取币安数据失败:', response.error);
    //   }
    // }).catch(error => {
    //   console.error('请求币安数据时发生错误:', error);
    // });
  }

  async onComplete() {
    console.log('任务完成');
  }
}