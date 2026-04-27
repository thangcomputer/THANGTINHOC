require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();


async function main() {
  console.log('🌱 Starting seed...');

  // Admin user
  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@thangtinhoc.vn' },
    update: {},
    create: {
      email: 'admin@thangtinhoc.vn',
      password: adminPass,
      fullName: 'Admin Thắng Tin Học',
      role: 'admin',
    },
  });

  // Test user
  const userPass = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'test@gmail.com' },
    update: {},
    create: {
      email: 'test@gmail.com',
      password: userPass,
      fullName: 'Nguyễn Văn Test',
      phone: '0901234567',
      role: 'user',
    },
  });

  // Categories
  const catCourse1 = await prisma.category.upsert({
    where: { slug: 'tin-hoc-van-phong' },
    update: {},
    create: { name: 'Tin Học Văn Phòng', slug: 'tin-hoc-van-phong', type: 'course' },
  });
  const catCourse2 = await prisma.category.upsert({
    where: { slug: 'excel-nang-cao' },
    update: {},
    create: { name: 'Excel Nâng Cao', slug: 'excel-nang-cao', type: 'course' },
  });
  const catCourse3 = await prisma.category.upsert({
    where: { slug: 'word-chuyen-nghiep' },
    update: {},
    create: { name: 'Word Chuyên Nghiệp', slug: 'word-chuyen-nghiep', type: 'course' },
  });
  const catPost1 = await prisma.category.upsert({
    where: { slug: 'thu-thuat-excel' },
    update: {},
    create: { name: 'Thủ Thuật Excel', slug: 'thu-thuat-excel', type: 'post' },
  });
  const catPost2 = await prisma.category.upsert({
    where: { slug: 'tin-tuc-cong-nghe' },
    update: {},
    create: { name: 'Tin Tức Công Nghệ', slug: 'tin-tuc-cong-nghe', type: 'post' },
  });

  // Courses
  const courses = [
    {
      title: 'Tin Học Văn Phòng Cơ Bản',
      slug: 'tin-hoc-van-phong-co-ban',
      description: 'Khóa học toàn diện về Word, Excel, PowerPoint cho người mới bắt đầu. Từ cơ bản đến thành thạo trong 30 ngày.',
      content: 'Nội dung chi tiết của khóa học...',
      price: 599000,
      originalPrice: 999000,
      level: 'beginner',
      duration: '30 giờ',
      totalLessons: 45,
      isPublished: true,
      isFeatured: true,
      categoryId: catCourse1.id,
    },
    {
      title: 'Excel Nâng Cao - Hàm & Công Thức',
      slug: 'excel-nang-cao-ham-cong-thuc',
      description: 'Thành thạo các hàm Excel nâng cao: VLOOKUP, INDEX/MATCH, Pivot Table, Dashboard.',
      content: 'Nội dung chi tiết của khóa học...',
      price: 799000,
      originalPrice: 1299000,
      level: 'intermediate',
      duration: '25 giờ',
      totalLessons: 38,
      isPublished: true,
      isFeatured: true,
      categoryId: catCourse2.id,
    },
    {
      title: 'Word Chuyên Nghiệp - Soạn Thảo Văn Bản',
      slug: 'word-chuyen-nghiep-soan-thao',
      description: 'Kỹ năng soạn thảo văn bản chuyên nghiệp, thiết kế tài liệu đẹp, mail merge.',
      content: 'Nội dung chi tiết của khóa học...',
      price: 499000,
      originalPrice: 799000,
      level: 'beginner',
      duration: '20 giờ',
      totalLessons: 30,
      isPublished: true,
      isFeatured: false,
      categoryId: catCourse3.id,
    },
    {
      title: 'PowerPoint & Thuyết Trình Chuyên Nghiệp',
      slug: 'powerpoint-thuyet-trinh',
      description: 'Thiết kế slide PowerPoint ấn tượng, kỹ năng thuyết trình, animation và hiệu ứng.',
      content: 'Nội dung chi tiết của khóa học...',
      price: 549000,
      originalPrice: 899000,
      level: 'beginner',
      duration: '18 giờ',
      totalLessons: 27,
      isPublished: true,
      isFeatured: true,
      categoryId: catCourse1.id,
    },
    {
      title: 'Excel VBA & Macro Automation',
      slug: 'excel-vba-macro',
      description: 'Lập trình VBA để tự động hóa Excel. Tạo macro, UserForm và ứng dụng quản lý.',
      content: 'Nội dung chi tiết của khóa học...',
      price: 999000,
      originalPrice: 1599000,
      level: 'advanced',
      duration: '35 giờ',
      totalLessons: 52,
      isPublished: true,
      isFeatured: false,
      categoryId: catCourse2.id,
    },
    {
      title: 'Google Workspace - Làm Việc Linh Hoạt',
      slug: 'google-workspace',
      description: 'Thành thạo Gmail, Google Drive, Docs, Sheets, Slides cho công việc hiệu quả.',
      content: 'Nội dung chi tiết của khóa học...',
      price: 399000,
      originalPrice: 699000,
      level: 'beginner',
      duration: '15 giờ',
      totalLessons: 22,
      isPublished: true,
      isFeatured: false,
      categoryId: catCourse1.id,
    },
  ];

  for (const c of courses) {
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });

    // Add sample lessons
    for (let i = 1; i <= Math.min(5, c.totalLessons); i++) {
      await prisma.lesson.upsert({
        where: { id: course.id * 100 + i },
        update: {},
        create: {
          id: course.id * 100 + i,
          title: `Bài ${i}: ${['Giới thiệu khóa học', 'Cài đặt phần mềm', 'Bài học đầu tiên', 'Thực hành cơ bản', 'Bài kiểm tra'][i-1]}`,
          content: 'Nội dung bài học...',
          duration: 30 + i * 5,
          order: i,
          isPreview: i <= 2,
          courseId: course.id,
        },
      }).catch(() => {});
    }
  }

  // Posts
  const posts = [
    {
      title: '10 Hàm Excel Quan Trọng Nhất Bạn Cần Biết',
      slug: '10-ham-excel-quan-trong',
      excerpt: 'Khám phá 10 hàm Excel thiết yếu giúp công việc của bạn trở nên nhanh chóng và hiệu quả hơn.',
      content: `<h2>1. Hàm SUM</h2><p>Hàm SUM được sử dụng để tính tổng các giá trị...</p><h2>2. Hàm VLOOKUP</h2><p>VLOOKUP giúp tìm kiếm dữ liệu trong bảng...</p>`,
      isPublished: true,
      isFeatured: true,
      views: 1520,
      categoryId: catPost1.id,
      authorId: admin.id,
    },
    {
      title: 'Cách Tạo Pivot Table Trong Excel Cho Người Mới',
      slug: 'cach-tao-pivot-table-excel',
      excerpt: 'Hướng dẫn từng bước tạo Pivot Table để phân tích dữ liệu một cách trực quan và chuyên nghiệp.',
      content: `<h2>Pivot Table Là Gì?</h2><p>Pivot Table là công cụ mạnh mẽ trong Excel...</p>`,
      isPublished: true,
      isFeatured: true,
      views: 987,
      categoryId: catPost1.id,
      authorId: admin.id,
    },
    {
      title: 'Microsoft Office 2024 - Những Tính Năng Mới Nhất',
      slug: 'microsoft-office-2024-tinh-nang-moi',
      excerpt: 'Microsoft vừa ra mắt Office 2024 với nhiều cải tiến AI mạnh mẽ. Hãy cùng khám phá.',
      content: `<h2>Copilot AI Trong Office</h2><p>Microsoft tích hợp AI Copilot vào toàn bộ bộ Office...</p>`,
      isPublished: true,
      isFeatured: false,
      views: 756,
      categoryId: catPost2.id,
      authorId: admin.id,
    },
    {
      title: 'Mẹo Soạn Thảo Văn Bản Word Nhanh Hơn 3x',
      slug: 'meo-soan-thao-word-nhanh-hon',
      excerpt: 'Những phím tắt và kỹ thuật ít người biết giúp bạn soạn thảo văn bản Word hiệu quả hơn nhiều.',
      content: `<h2>Phím Tắt Cơ Bản</h2><p>Ctrl+B: In đậm, Ctrl+I: In nghiêng...</p>`,
      isPublished: true,
      isFeatured: false,
      views: 645,
      categoryId: catPost1.id,
      authorId: admin.id,
    },
    {
      title: 'Học Tin Học Văn Phòng Online - Xu Hướng 2024',
      slug: 'hoc-tin-hoc-van-phong-online-2024',
      excerpt: 'Học online trở thành xu hướng chính. Tìm hiểu cách học tin học văn phòng hiệu quả nhất.',
      content: `<h2>Tại Sao Nên Học Online?</h2><p>Học online mang lại sự linh hoạt về thời gian...</p>`,
      isPublished: true,
      isFeatured: true,
      views: 432,
      categoryId: catPost2.id,
      authorId: admin.id,
    },
  ];

  for (const p of posts) {
    await prisma.post.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log('👤 Admin: admin@thangtinhoc.vn / admin123');
  console.log('👤 User: test@gmail.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
