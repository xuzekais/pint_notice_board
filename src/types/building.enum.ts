/**
 * 枚举：栋数（Building）和栋数备注（BuildingNote）
 * 值从 1 开始，顺序按照用户提供的列表。
 */
export enum Building {
  // 1
  TUSHUGUAN = 1, // 图书馆
  // 2
  KEJILOU_B = 2, // 科技楼B
  // 3
  D15 = 3, // 15栋
  // 4
  D6 = 4, // 6栋
  // 5
  D2 = 5, // 2栋
  // 6
  D1 = 6, // 1栋
  // 7
  D24 = 7, // 24栋
  // 8
  D3 = 8, // 3栋
  // 9
  D5 = 9, // 5栋
  // 10
  D7 = 10, // 7栋
  // 11
  D8 = 11, // 8栋
  // 12
  D12 = 12, // 12栋
  // 13
  D9 = 13, // 9栋
  // 14
  D10 = 14, // 10栋
  // 15
  D11 = 15, // 11栋
  // 16
  D20 = 16, // 20栋
  // 17
  D21 = 17, // 21栋
  // 18
  D22 = 18, // 22栋
  // 19
  D17 = 19, // 17栋
  // 20
  D16 = 20, // 16栋
  // 21
  D23 = 21, // 23栋
  // 22
  D18 = 22, // 18栋
  // 23
  D19 = 23, // 19栋
  // 24
  D25 = 24, // 25栋
  // 25
  D26 = 25, // 26栋
  // 26
  HUAGONGLOU = 26, // 化工楼
  // 27
  FUZHUANLOU = 27, // 服装楼
  // 28
  TIANJIABING = 28, // 田家炳
  // 29
  XURILOU = 29, // 旭日楼
  // 30
  XINGZHENGLOU = 30, // 行政楼
  // 31
  DIANZILOU = 31, // 电子楼
  // 32
  YINYUELOU = 32, // 音乐楼
  // 33
  SHIXUNLOU = 33, // 实训楼
  // 34
  BEIYUAN = 34, // 北苑
}

export enum BuildingNote {
  // 1
  NOTE_TUSHUGUAN = 1, // 须备注“图书馆”，否则可能会漏打印
  // 2
  NOTE_KEB = 2, // 须备注“科B”，否则可能会漏打印
  // 原中苑1-13
  YUAN_ZHONGYUAN_1 = 3,
  YUAN_ZHONGYUAN_2 = 4,
  YUAN_ZHONGYUAN_3 = 5,
  YUAN_ZHONGYUAN_4 = 6,
  YUAN_ZHONGYUAN_5 = 7,
  YUAN_ZHONGYUAN_6 = 8,
  YUAN_ZHONGYUAN_7 = 9,
  YUAN_ZHONGYUAN_8 = 10,
  YUAN_ZHONGYUAN_9 = 11,
  YUAN_ZHONGYUAN_10 = 12,
  YUAN_ZHONGYUAN_11 = 13,
  YUAN_ZHONGYUAN_12 = 14,
  YUAN_ZHONGYUAN_13 = 15,
  // 南苑1-9
  NANYUAN_1 = 16,
  NANYUAN_2 = 17,
  NANYUAN_3 = 18,
  NANYUAN_4 = 19,
  NANYUAN_5 = 20,
  NANYUAN_6 = 21,
  NANYUAN_7 = 22,
  NANYUAN_8 = 23,
  NANYUAN_9 = 24,
  // 学生中心（与中南苑同趟次）
  STUDENT_CENTER = 25,
  // 26-34: 各类须备注项
  NOTE_HUAGONGLOU = 26, // 须备注“化工楼”，否则可能会漏打印
  NOTE_FUZHUANLOU = 27, // 须备注“服装楼”，否则可能会漏打印
  NOTE_TIANJIABING = 28, // 须备注“田家炳”，否则可能会漏打印
  NOTE_XURI = 29, // 须备注“旭日”，否则可能会漏打印
  NOTE_XINGZHENGLOU = 30, // 须备注“行政楼”，否则可能会漏打印
  NOTE_DIANZI = 31, // 须备注“电子”，否则可能会漏打印
  NOTE_YINYUE = 32, // 须备注“音乐楼”，否则可能会漏打印
  NOTE_SHIXUN = 33, // 须备注“实训楼”，否则可能会漏打印
  NOTE_BEIYUAN = 34, // 须备注“北苑”，否则可能会漏打印（只送到北1）
}
