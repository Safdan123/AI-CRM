import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

const auth = env.smtp.user && env.smtp.pass ? { user: env.smtp.user, pass: env.smtp.pass } : undefined

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth,
})

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({ from: env.smtp.from, to, subject, html })
    return true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[auth-service] sendEmail failed:', (err as Error).message)
    return false
  }
}
