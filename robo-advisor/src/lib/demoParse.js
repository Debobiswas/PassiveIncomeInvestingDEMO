// Browser-side workbook parsing for the demo portal. Nothing here touches
// the network — the parsed result lives only in React state.
import * as XLSX from 'xlsx';

export async function parseWorkbook(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error('That file has no readable sheets.');

  // header:1 yields an array-of-arrays so we can find the real header row
  // ourselves — broker exports often carry title rows above it.
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: null });
  if (matrix.length === 0) throw new Error('That file appears to be empty.');

  const headerIndex = matrix.findIndex(
    row => Array.isArray(row) && row.filter(c => c !== null && String(c).trim() !== '').length >= 2
  );
  if (headerIndex === -1) throw new Error('Could not find a header row in that file.');

  const headers = matrix[headerIndex].map(h => (h === null ? '' : String(h).trim()));
  const rows = matrix.slice(headerIndex + 1)
    .filter(row => row.some(c => c !== null && String(c).trim() !== ''))
    .map(row => {
      const record = {};
      headers.forEach((h, i) => { record[h] = row[i] ?? null; });
      return record;
    });

  return { headers, rows };
}
