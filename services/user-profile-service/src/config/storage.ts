import { Client } from 'minio'
import { env } from './env.js'

export const storage = new Client({
  endPoint: env.minio.endpoint,
  port: env.minio.port,
  useSSL: env.minio.useSSL,
  accessKey: env.minio.accessKey,
  secretKey: env.minio.secretKey,
})

export async function ensureBucket() {
  const exists = await storage.bucketExists(env.minio.bucket).catch(() => false)
  if (!exists) {
    await storage.makeBucket(env.minio.bucket).catch((err) => {
      if (err?.code !== 'BucketAlreadyOwnedByYou') throw err
    })
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${env.minio.bucket}/*`],
        },
      ],
    }
    await storage.setBucketPolicy(env.minio.bucket, JSON.stringify(policy)).catch(() => {})
  }
}
