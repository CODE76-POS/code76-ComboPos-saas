/** RFC 4180 records with UTF-8 BOM. Branding is columns, never invalid trailing rows. */
export function csvCell(value:unknown):string{
 if(value===null||value===undefined)return '""';
 const raw=typeof value==='object'?JSON.stringify(value):String(value);
 const safe=typeof value==='string' && (/^[\s\u0000-\u001f]*[=+\-@]/.test(raw)||/^[\t\r\n]/.test(raw))?`'${raw}`:raw;
 return `"${safe.replace(/"/g,'""')}"`;
}
export function serializeCsvRows(headers:readonly string[],rows:readonly (readonly unknown[])[]):string{return '\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';}
export function parseCsvRecords(text:string):Record<string,string>[]{
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 const input=text.replace(/^\uFEFF/,'');
 for(let i=0;i<input.length;i++){const char=input[i];if(char==='"'){if(quoted&&input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(char===','&&!quoted){row.push(cell);cell='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&input[i+1]==='\n')i++;row.push(cell);if(row.some(value=>value!==''))rows.push(row);row=[];cell='';}else cell+=char;}
 if(quoted)throw new Error('CSV has an unclosed quoted field.');
 if(cell!==''||row.length){row.push(cell);rows.push(row);}
 if(rows.length<2)return [];
 const headers=rows.shift()!.map(header=>header.trim());
 return rows.filter(values=>values.some(value=>value.trim()!=='')).map(values=>Object.fromEntries(headers.map((header,i)=>[header,values[i]??''])));
}
