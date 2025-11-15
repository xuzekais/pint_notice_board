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
  ) {
    const p = Number(page) || 1;
    const ps = Number(pageSize) || 0;
    const result = await this.orderService.getOrderList({ page: p, pageSize: ps, mergeOrderId, userId, orderType, payStart, payEnd, addressNum });
    return result;
  }
}
