import { Controller, Get, Inject, Query } from '@midwayjs/core';
import { UserService } from '@app/service/user.service';

@Controller('/api/user')
export class UserController {
  @Inject()
  userService: UserService;

  @Get('/getUserList')
  async getUserList(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('hasFirstOrder') hasFirstOrder?: string,
    @Query('userId') userId?: string,
    @Query('regStart') regStart?: string,
    @Query('regEnd') regEnd?: string,
    @Query('firstOrderStart') firstOrderStart?: string,
    @Query('firstOrderEnd') firstOrderEnd?: string,
  ) {
    // page & pageSize are optional; service will handle defaults
    const p = Number(page) || 1;
    const ps = Number(pageSize) || 10; // 默认10条
    const opts = {
      page: p,
      pageSize: ps,
      hasFirstOrder: hasFirstOrder, // '1' or '0'
      userId,
      regStart,
      regEnd,
      firstOrderStart,
      firstOrderEnd,
    };
    const result = await this.userService.getUserList(opts);
    return result;
  }
}
