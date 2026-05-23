import { Queue, QueueEvents, Worker, type Job } from 'bullmq'
import IORedis from 'ioredis'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import { env } from './config/env.js'

export type ReportJobData = {
  type: 'rewards-pdf' | 'rewards-xlsx'
  userId: string
  format: 'pdf' | 'xlsx'
}

export type ReportJobResult = {
  buffer: string
  contentType: string
  filename: string
}

const connection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null })
export const reportQueue = new Queue<ReportJobData, ReportJobResult>('reports', { connection })
export const reportQueueEvents = new QueueEvents('reports', { connection })

async function fetchLedger(userId: string) {
  try {
    const r = await fetch(`${env.rewardServiceUrl}/api/rewards/_internal/by-user?userId=${userId}`, {
      headers: { 'x-internal-key': env.jwtSecret },
    })
    if (!r.ok) return [] as Array<{ amount: number; currency: string; entryType: string; description: string; createdAt: string }>
    const json = (await r.json()) as { data?: Array<{ amount: number; currency: string; entryType: string; description: string; createdAt: string }> }
    return json.data ?? []
  } catch {
    return []
  }
}

async function buildPdf(userId: string): Promise<ReportJobResult> {
  const ledger = await fetchLedger(userId)
  return await new Promise<ReportJobResult>((resolve) => {
    const doc = new PDFDocument()
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () =>
      resolve({
        buffer: Buffer.concat(chunks).toString('base64'),
        contentType: 'application/pdf',
        filename: `rewards-${userId}.pdf`,
      }),
    )
    doc.fontSize(18).text('Mabrook Rewards Report')
    doc.moveDown()
    doc.fontSize(12).text(`Generated for user: ${userId}`)
    doc.text(`Generated at: ${new Date().toISOString()}`)
    doc.moveDown()
    if (ledger.length === 0) {
      doc.text('No ledger entries found.')
    } else {
      ledger.forEach((entry) => {
        doc.text(
          `${entry.createdAt} | ${entry.entryType.toUpperCase()} | ${entry.amount} ${entry.currency} | ${entry.description}`,
        )
      })
    }
    doc.end()
  })
}

async function buildXlsx(userId: string): Promise<ReportJobResult> {
  const ledger = await fetchLedger(userId)
  const wb = new ExcelJS.Workbook()
  const sheet = wb.addWorksheet('Rewards')
  sheet.columns = [
    { header: 'Date', key: 'createdAt', width: 22 },
    { header: 'Type', key: 'entryType', width: 10 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Currency', key: 'currency', width: 10 },
    { header: 'Description', key: 'description', width: 40 },
  ]
  sheet.addRows(ledger)
  const buf = await wb.xlsx.writeBuffer()
  return {
    buffer: Buffer.from(buf).toString('base64'),
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: `rewards-${userId}.xlsx`,
  }
}

export function startWorker() {
  return new Worker<ReportJobData, ReportJobResult>(
    'reports',
    async (job: Job<ReportJobData>) => {
      if (job.data.type === 'rewards-pdf' || job.data.format === 'pdf') return buildPdf(job.data.userId)
      return buildXlsx(job.data.userId)
    },
    { connection },
  )
}
