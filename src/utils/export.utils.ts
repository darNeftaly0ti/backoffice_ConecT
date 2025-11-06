/**
 * Utilidades para exportar datos a diferentes formatos
 */

/**
 * Exporta datos a CSV
 */
export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // Obtener headers si no se proporcionan
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Crear contenido CSV
  const csvContent = [
    csvHeaders.join(','), // Header row
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Escapar comillas y envolver en comillas si contiene coma
        if (value === null || value === undefined) return '';
        const stringValue = String(value).replace(/"/g, '""');
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      }).join(',')
    )
  ].join('\n');

  // Crear blob y descargar
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta datos a Excel (formato CSV con extensión .xlsx)
 * Nota: Para un verdadero Excel necesitarías una librería como xlsx
 */
export const exportToExcel = (data: any[], filename: string, headers?: string[]) => {
  // Por ahora usamos CSV, pero podrías usar una librería como xlsx
  exportToCSV(data, filename, headers);
};

/**
 * Exporta datos a JSON
 */
export const exportToJSON = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta datos a PDF usando window.print()
 * Genera un HTML temporal para imprimir
 */
export const exportToPDF = (
  title: string,
  content: string,
  filename: string
) => {
  // Crear ventana de impresión
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes para exportar a PDF');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #1E40AF;
          border-bottom: 2px solid #1E40AF;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #1E40AF;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${content}
      <div class="footer">
        <p>Generado el ${new Date().toLocaleString('es-CO')}</p>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  
  // Esperar a que se cargue el contenido antes de imprimir
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

/**
 * Convierte una tabla HTML a string para PDF
 */
export const tableToHTML = (data: any[], headers: string[], headerLabels?: string[]): string => {
  const labels = headerLabels || headers;
  
  let html = '<table>';
  
  // Header row
  html += '<thead><tr>';
  labels.forEach(label => {
    html += `<th>${label}</th>`;
  });
  html += '</tr></thead>';
  
  // Body rows
  html += '<tbody>';
  data.forEach(row => {
    html += '<tr>';
    headers.forEach(header => {
      const value = row[header];
      html += `<td>${value === null || value === undefined ? '' : String(value)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody>';
  
  html += '</table>';
  return html;
};

