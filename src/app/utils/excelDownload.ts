import * as XLSX from 'xlsx';

interface DownloadOptions {
  filename: string;
  sheetName?: string;
}

export const downloadExcel = (data: any[], options: DownloadOptions) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'Sheet1');
  
  // Generate Excel file
  XLSX.writeFile(wb, `${options.filename}.xlsx`);
}; 