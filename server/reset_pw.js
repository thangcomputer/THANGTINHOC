const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Update Admin
  await prisma.user.update({
    where: { email: 'admin@thangtinhoc.vn' },
    data: { password: hashedPassword, role: 'admin', isActive: true },
  });
  console.log('✅ Admin password reset to: admin123');

  // Update Student
  await prisma.user.update({
    where: { email: 'test@gmail.com' },
    data: { password: userPassword, role: 'user', isActive: true },
  });
  console.log('✅ Student password reset to: user123');

  process.exit(0);
}

main();
