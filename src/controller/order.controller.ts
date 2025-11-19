import { Controller, Get, Inject, Query } from '@midwayjs/core';
import { OrderService } from '@app/service/order.service';

@Controller('/api/order')
export class OrderController {
  @Inject()
  orderService: OrderService;

  @Get('/getOrderList')
  async getOrderList(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('mergeOrderId') mergeOrderId?: string,
    @Query('userId') userId?: string,
    @Query('orderType') orderType?: string,
    @Query('payStart') payStart?: string,
    @Query('payEnd') payEnd?: string,
    @Query('addressNum') addressNum?: string,
    @Query('fileName') fileName?: string,
  ) {
    const p = Number(page) || 1;
    const ps = Number(pageSize) || 0;
    const result = await this.orderService.getOrderList({ page: p, pageSize: ps, mergeOrderId, userId, orderType, payStart, payEnd, addressNum, fileName });
    return result;
  }

  @Get('/getOrderFiles')
  async getOrderFiles(@Query('mergeOrderId') mergeOrderId: string) {
    if (!mergeOrderId) {
      return { error: 'mergeOrderId is required' };
    }
    const files = await this.orderService.getOrderFiles(mergeOrderId);
    return { data: files };
  }

  @Get('/getOrderSummary')
  async getOrderSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.orderService.getOrderSummary({ startDate, endDate });
    return result;
  }

  @Get('/getOrderHourlyStats')
  async getOrderHourlyStats(
    @Query('addressNum') addressNum?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.orderService.getOrderHourlyStats({ addressNum, startDate, endDate });
    return result;
  }
}
