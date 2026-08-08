export async function generateContract(bookingData: {
  tenantName: string
  tenantEmail: string
  propertyName: string
  propertyAddress: string
  unitName: string
  startDate: string
  endDate: string
  totalPrice: number
  dpAmount: number
  remainingAmount: number
}): Promise<Blob> {
  const { default: PDFDocument } = await import('pdf-lib')
  const pdfDoc = await PDFDocument.create()

  const page = pdfDoc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()
  const margin = 50

  page.drawText('Sewa Kontrak', { x: margin, y: height - margin, size: 24, font: await pdfDoc.embedFont('Helvetica-Bold') })
  page.drawText(`Penyewa: ${bookingData.tenantName}`, { x: margin, y: height - margin - 40, size: 12, font: await pdfDoc.embedFont('Helvetica') })
  page.drawText(`Email: ${bookingData.tenantEmail}`, { x: margin, y: height - margin - 60, size: 12, font: await pdfDoc.embedFont('Helvetica') })
  page.drawText(`Properti: ${bookingData.propertyName}`, { x: margin, y: height - margin - 80, size: 12, font: await pdfDoc.embedFont('Helvetica') })
  page.drawText(`Alamat: ${bookingData.propertyAddress}`, { x: margin, y: height - margin - 100, size: 12, font: await pdfDoc.embedFont('Helvetica') })
  page.drawText(`Unit: ${bookingData.unitName}`, { x: margin, y: height - margin - 120, size: 12, font: await pdfDoc.embedFont('Helvetica') })
  page.drawText(`Mulai: ${bookingData.startDate}`, { x: margin, y: height - margin - 140, size: 12, font: await pdfDoc.embedFont('Helvetica') })
  page.drawText(`Selesai: ${bookingData.endDate}`, { x: margin, y: height - margin - 160, size: 12, font: await pdfDoc.embedFont('Helvetica') })
  page.drawText(`Total Harga: Rp ${bookingData.totalPrice.toLocaleString('id-ID')}`, { x: margin, y: height - margin - 180, size: 12, font: await pdfDoc.embedFont('Helvetica') })
  page.drawText(`DP: Rp ${bookingData.dpAmount.toLocaleString('id-ID')}`, { x: margin, y: height - margin - 200, size: 12, font: await pdfDoc.embedFont('Helvetica') })
  page.drawText(`Sisa: Rp ${bookingData.remainingAmount.toLocaleString('id-ID')}`, { x: margin, y: height - margin - 220, size: 12, font: await pdfDoc.embedFont('Helvetica') })

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}
