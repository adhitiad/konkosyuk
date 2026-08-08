export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          const stringValue = value === null || value === undefined ? '' : String(value)
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue
        })
        .join(',')
    ),
  ]

  const csvString = csvRows.join('\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
