/**
 * Building 映射：编码 <-> 中文
 * - CODE_TO_CHINESE: 编码（数字）映射为中文名称
 * - CHINESE_TO_CODE: 中文名称映射为编码（数字）
 *
 * 数值从 1 开始，与用户提供的顺序一致。
 */

export const CODE_TO_CHINESE: Record<number, string> = {
	1: '图书馆',
	2: '科技楼B',
	3: '15栋',
	4: '6栋',
	5: '2栋',
	6: '1栋',
	7: '24栋',
	8: '3栋',
	9: '5栋',
	10: '7栋',
	11: '8栋',
	12: '12栋',
	13: '9栋',
	14: '10栋',
	15: '11栋',
	16: '20栋',
	17: '21栋',
	18: '22栋',
	19: '17栋',
	20: '16栋',
	21: '23栋',
	22: '18栋',
	23: '19栋',
	24: '25栋',
	25: '26栋',
	26: '化工楼',
	27: '服装楼',
	28: '田家炳',
	29: '旭日楼',
	30: '行政楼',
	31: '电子楼',
	32: '音乐楼',
	33: '实训楼',
	34: '北苑',
	35: '其他',
} as const;

export const CHINESE_TO_CODE: Record<string, number> = {
	'图书馆': 1,
	'科技楼B': 2,
	'15栋': 3,
	'6栋': 4,
	'2栋': 5,
	'1栋': 6,
	'24栋': 7,
	'3栋': 8,
	'5栋': 9,
	'7栋': 10,
	'8栋': 11,
	'12栋': 12,
	'9栋': 13,
	'10栋': 14,
	'11栋': 15,
	'20栋': 16,
	'21栋': 17,
	'22栋': 18,
	'17栋': 19,
	'16栋': 20,
	'23栋': 21,
	'18栋': 22,
	'19栋': 23,
	'25栋': 24,
	'26栋': 25,
	'化工楼': 26,
	'服装楼': 27,
	'田家炳': 28,
	'旭日楼': 29,
	'行政楼': 30,
	'电子楼': 31,
	'音乐楼': 32,
	'实训楼': 33,
	'北苑': 34,
	'其他': 35,
} as const;

export type BuildingCode = keyof typeof CODE_TO_CHINESE;
export type BuildingName = typeof CHINESE_TO_CODE[keyof typeof CHINESE_TO_CODE];

export function codeToChinese(code?: number): string | undefined {
	if (code == null) return undefined;
	return (CODE_TO_CHINESE as any)[code];
}

export function chineseToCode(label?: string): number | undefined {
	if (!label) return undefined;
	return (CHINESE_TO_CODE as any)[label.trim()];
}

// --------- 栋数备注映射（数字 <-> 中文） ---------
export const NOTE_CODE_TO_CHINESE: Record<number, string> = {
	1: '须备注“图书馆”，否则可能会漏打印',
	2: '须备注“科B”，否则可能会漏打印',
	3: '原中苑1',
	4: '原中苑2',
	5: '原中苑3',
	6: '原中苑4',
	7: '原中苑5',
	8: '原中苑6',
	9: '原中苑7',
	10: '原中苑8',
	11: '原中苑9',
	12: '原中苑10',
	13: '原中苑11',
	14: '原中苑12',
	15: '原中苑13',
	16: '南苑1',
	17: '南苑2',
	18: '南苑3',
	19: '南苑4',
	20: '南苑5',
	21: '南苑6',
	22: '南苑7',
	23: '南苑8',
	24: '南苑9',
	25: '学生中心)（与中南苑同趟次',
	26: '须备注“化工楼”，否则可能会漏打印',
	27: '须备注“服装楼”，否则可能会漏打印',
	28: '须备注“田家炳”，否则可能会漏打印',
	29: '须备注“旭日”，否则可能会漏打印',
	30: '须备注“行政楼”，否则可能会漏打印',
	31: '须备注“电子”，否则可能会漏打印',
	32: '须备注“音乐楼”，否则可能会漏打印',
	33: '须备注“实训楼”，否则可能会漏打印',
	34: '须备注“北苑”，否则可能会漏打印（只送到北1）',
	35: '这个也加一下',
} as const;

export const NOTE_CHINESE_TO_CODE: Record<string, number> = {
	'须备注“图书馆”，否则可能会漏打印': 1,
	'须备注“科B”，否则可能会漏打印': 2,
	'原中苑1': 3,
	'原中苑2': 4,
	'原中苑3': 5,
	'原中苑4': 6,
	'原中苑5': 7,
	'原中苑6': 8,
	'原中苑7': 9,
	'原中苑8': 10,
	'原中苑9': 11,
	'原中苑10': 12,
	'原中苑11': 13,
	'原中苑12': 14,
	'原中苑13': 15,
	'南苑1': 16,
	'南苑2': 17,
	'南苑3': 18,
	'南苑4': 19,
	'南苑5': 20,
	'南苑6': 21,
	'南苑7': 22,
	'南苑8': 23,
	'南苑9': 24,
	'学生中心)（与中南苑同趟次': 25,
	'须备注“化工楼”，否则可能会漏打印': 26,
	'须备注“服装楼”，否则可能会漏打印': 27,
	'须备注“田家炳”，否则可能会漏打印': 28,
	'须备注“旭日”，否则可能会漏打印': 29,
	'须备注“行政楼”，否则可能会漏打印': 30,
	'须备注“电子”，否则可能会漏打印': 31,
	'须备注“音乐楼”，否则可能会漏打印': 32,
	'须备注“实训楼”，否则可能会漏打印': 33,
	'须备注“北苑”，否则可能会漏打印（只送到北1）': 34,
	'这个也加一下': 35,
} as const;

export type BuildingNoteCode = keyof typeof NOTE_CODE_TO_CHINESE;
export type BuildingNoteName = typeof NOTE_CHINESE_TO_CODE[keyof typeof NOTE_CHINESE_TO_CODE];

export function noteCodeToChinese(code?: number): string | undefined {
	if (code == null) return undefined;
	return (NOTE_CODE_TO_CHINESE as any)[code];
}

export function chineseToNoteCode(label?: string): number | undefined {
	if (!label) return undefined;
	return (NOTE_CHINESE_TO_CODE as any)[label.trim()];
}


