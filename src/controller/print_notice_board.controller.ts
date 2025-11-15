import { Controller, Get, Inject, Query } from '@midwayjs/core';
import { PrintNoticeBoardService } from '@app/service/print_notice_board.service';

@Controller('/api/printNoticeBoard')
export class PrintNoticeBoardController {
    @Inject()
    printNoticeBoardService: PrintNoticeBoardService;

    @Get('/checkCookie')
    async checkCookie(@Query('mycookie') mycookie?: string) {
        const result = await this.printNoticeBoardService.checkCookie(mycookie);
        return result;
    }

    @Get('/initData')
    async initData(@Query('mycookie') mycookie?: string) {
        const result = await this.printNoticeBoardService.initData(mycookie);
        return result;
    }

    @Get('/initUsers')
    async initUsers(@Query('mycookie') mycookie?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
        const result = await this.printNoticeBoardService.initUserData(mycookie, startDate, endDate);
        return result;
    }

    @Get('/initOrders')
    async initOrders(@Query('mycookie') mycookie?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
        const result = await this.printNoticeBoardService.initOrders(mycookie, startDate, endDate);
        return result;
    }

    @Get('/updateNoticeBoard')
    async updateNoticeBoard(@Query('mycookie') mycookie?: string) {
        const result = await this.printNoticeBoardService.updateNoticeBoard(mycookie);
        return result;
    }

}
