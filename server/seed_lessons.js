const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany();
  
  for (const course of courses) {
    // Add 3-5 lessons for each course
    const count = Math.floor(Math.random() * 3) + 3;
    for (let i = 1; i <= count; i++) {
      await prisma.lesson.create({
        data: {
          title: `Bài học ${i}: Hướng dẫn chi tiết về ${course.title}`,
          content: `<h3>Nội dung bài học ${i}</h3><p>Trong bài học này, chúng ta sẽ tìm hiểu về các khái niệm cơ bản và cách áp dụng thực tế của ${course.title}. Đây là kiến thức quan trọng để bạn có thể làm chủ công cụ này.</p><ul><li>Khái niệm cơ bản</li><li>Thực hành trực tiếp</li><li>Bài tập về nhà</li></ul>`,
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Demo video
          duration: 15,
          order: i,
          isPreview: i === 1,
          courseId: course.id
        }
      });
    }
    
    // Update course totalLessons
    await prisma.course.update({
      where: { id: course.id },
      data: { totalLessons: count, isPublished: true }
    });
  }

  console.log('✅ Đã thêm bài học mẫu cho tất cả khóa học!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
