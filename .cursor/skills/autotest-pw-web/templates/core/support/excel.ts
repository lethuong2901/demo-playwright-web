import ExcelJS from 'exceljs';

export interface CellPosition { row: number; column: number }

/** Find the first cell whose value equals `text` (course: readExcel). Returns null if absent. */
export function findCell(sheet: ExcelJS.Worksheet, text: string): CellPosition | null {
  let found: CellPosition | null = null;
  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      if (!found && cell.value === text) found = { row: rowNumber, column: colNumber };
    });
  });
  return found;
}

/**
 * Update the cell at an offset from the cell containing `searchText` (course: writeExcelTest).
 * Example: change the price 2 columns to the right of "Mango" → { rowChange: 0, colChange: 2 }.
 */
export async function updateCellNextTo(
  filePath: string,
  searchText: string,
  newValue: string | number,
  offset: { rowChange: number; colChange: number },
  sheetName = 'Sheet1',
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) throw new Error(`Không có sheet "${sheetName}" trong ${filePath}`);
  const pos = findCell(sheet, searchText);
  if (!pos) throw new Error(`Không tìm thấy "${searchText}" trong ${filePath}`);
  sheet.getCell(pos.row + offset.rowChange, pos.column + offset.colChange).value = newValue;
  await workbook.xlsx.writeFile(filePath);
}
