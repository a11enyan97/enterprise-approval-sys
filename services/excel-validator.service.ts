import * as XLSX from 'xlsx';
import { z } from 'zod';
import iconv from 'iconv-lite';

/**
 * Excel 行数据校验 Schema
 * 兼容处理：允许字段为数字，统一转换为字符串进行非空校验
 */
const ExcelRowSchema = z.object({
  '项目名称': z.union([z.string(), z.number()]).transform(String).refine(s => s.trim().length > 0, '项目名称不能为空'),
  '申请经费': z.union([z.string(), z.number()]).transform(String).refine(s => s.trim().length > 0, '申请经费不能为空'),
  // '申请理由' 为选填，不做非空校验
  '申请理由': z.union([z.string(), z.number()]).transform(String).optional(),
  '申请人': z.union([z.string(), z.number()]).transform(String).refine(s => s.trim().length > 0, '申请人不能为空'),
});

/**
 * 校验结果接口定义
 */
export interface ExcelValidationResult {
  success: boolean;
  error?: string;
  errors?: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  data?: z.infer<typeof ExcelRowSchema>[];
}

/**
 * Excel 文件校验核心函数
 * @param fileBuffer 文件二进制流
 * @param filename 文件名
 */
export async function validateExcelFile(
  fileBuffer: Buffer,
  filename: string
): Promise<ExcelValidationResult> {
  try {
    // ---------------------------------------------------------
    // 1. 智能读取与乱码修复
    // ---------------------------------------------------------
    let workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    if (!workbook.SheetNames.length) {
      return { success: false, error: 'Excel 文件为空或格式不正确' };
    }

    let sheetName = workbook.SheetNames[0];
    let worksheet = workbook.Sheets[sheetName];
    
    // 预读取第一行用于检测是否乱码
    let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    const firstRowStr = JSON.stringify(jsonData[0] || []);

    // 检测典型的 GBK -> Latin1 乱码特征 (如 Ïî, Éê, ¿ 等字符)
    const isMojibake = firstRowStr.includes('Ïî') || firstRowStr.includes('Éê') || firstRowStr.includes('¿');

    if (isMojibake) {
      console.log(`[Excel校验] 检测到文件 "${filename}" 存在编码问题，尝试使用 GBK 修复...`);
      try {
        // 使用 iconv-lite 将 GBK Buffer 解码为 UTF-8 字符串
        const str = iconv.decode(fileBuffer, 'gbk');
        // 重新解析
        workbook = XLSX.read(str, { type: 'string' });
        sheetName = workbook.SheetNames[0];
        worksheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
      } catch (e) {
        console.error('[Excel校验] 乱码修复失败:', e);
        // 修复失败则继续使用原数据，后续步骤会捕获表头缺失错误
      }
    }

    if (!jsonData || jsonData.length === 0) {
      return { success: false, error: 'Excel 内容为空，请检查文件' };
    }

    // ---------------------------------------------------------
    // 2. 智能定位表头
    // ---------------------------------------------------------
    const requiredHeaders = ['项目名称', '申请经费', '申请人'];
    
    // 强力清洗函数：移除所有空白字符、换行符
    const normalize = (str: any) => String(str || '').replace(/\s+/g, '').trim();

    let headerRowIndex = -1;
    let headers: string[] = [];

    // 扫描前 5 行寻找有效表头
    const scanLimit = Math.min(jsonData.length, 5);
    for (let i = 0; i < scanLimit; i++) {
      const rowCleaned = jsonData[i].map(normalize);
      // 只要包含所有必需字段，就认为是表头行
      const missing = requiredHeaders.filter(req => !rowCleaned.includes(req));
      
      if (missing.length === 0) {
        headerRowIndex = i;
        headers = jsonData[i].map(normalize); // 保存清洗后的表头
        break;
      }
    }

    if (headerRowIndex === -1) {
      // 构造调试信息供前端展示
      const firstRowSnapshot = jsonData[0] ? jsonData[0].map(item => `"${String(item)}"`).join(', ') : '空';
      return {
        success: false,
        error: `无法识别表头格式。\n请确保表格前5行中包含以下列名：${requiredHeaders.join('、')}\n`,
      };
    }

    // ---------------------------------------------------------
    // 3. 数据提取与校验
    // ---------------------------------------------------------
    const dataRows = jsonData.slice(headerRowIndex + 1);
    const validData: any[] = [];
    const errors: Array<any> = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      // 跳过全空行
      if (row.every((cell) => !cell || String(cell).trim() === '')) continue;

      const rowObj: Record<string, any> = {};
      
      // 根据定位到的表头映射数据
      row.forEach((cell, cellIndex) => {
        const rawHeaderName = jsonData[headerRowIndex][cellIndex];
        const cleanHeaderName = normalize(rawHeaderName);
        // 只提取清洗后非空的列名
        if (cleanHeaderName) {
          rowObj[cleanHeaderName] = cell;
        }
      });

      // Zod 校验
      const result = ExcelRowSchema.safeParse(rowObj);

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          errors.push({
            row: i + headerRowIndex + 2, // 修正行号显示 (索引+表头行+1(人类计数))
            field: issue.path.join('.'),
            message: issue.message,
          });
        });
      } else {
        validData.push(result.data);
      }
    }

    // ---------------------------------------------------------
    // 4. 返回结果
    // ---------------------------------------------------------
    if (errors.length > 0) {
      const errorMsgLimit = 5; // 只展示前5条错误，避免弹窗爆炸
      const topErrors = errors.slice(0, errorMsgLimit).map(
        (err) => `第 ${err.row} 行 [${err.field}]: ${err.message}`
      );
      const moreMsg = errors.length > errorMsgLimit ? `\n...以及其他 ${errors.length - errorMsgLimit} 个错误` : '';

      return {
        success: false,
        error: `校验失败，共发现 ${errors.length} 个错误：\n${topErrors.join('\n')}${moreMsg}`,
        errors,
      };
    }

    return {
      success: true,
      data: validData,
    };

  } catch (error) {
    console.error('Excel处理异常:', error);
    const msg = error instanceof Error ? error.message : '未知系统错误';
    return {
      success: false,
      error: `文件解析发生系统错误: ${msg}`,
    };
  }
}