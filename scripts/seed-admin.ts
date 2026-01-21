import { PrismaClient } from '@prisma/client'
import { scrypt, randomBytes } from 'crypto'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = await new Promise<string>((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err)
      resolve(derivedKey.toString('hex'))
    })
  })
  return `${salt}:${hash}`
}

async function main() {
  const email = process.env.ADMIN_EMAIL || 'payments.bardatcha@gmail.com'
  const password = process.argv[2]

  if (!password) {
    console.error('Usage: npx tsx scripts/seed-admin.ts <password>')
    console.error('Example: npx tsx scripts/seed-admin.ts mySecurePassword123')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters')
    process.exit(1)
  }

  const passwordHash = await hashPassword(password)

  const admin = await prisma.adminConfig.upsert({
    where: { id: 'admin' },
    update: {
      email,
      passwordHash,
    },
    create: {
      id: 'admin',
      email,
      passwordHash,
    },
  })

  console.log('Admin user created/updated successfully!')
  console.log(`Email: ${admin.email}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
