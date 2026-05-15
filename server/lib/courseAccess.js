const prisma = require('./db');

const PUBLIC_LESSON_FIELDS = ['id', 'title', 'duration', 'order', 'isPreview'];

async function isUserEnrolled(userId, courseId) {
  if (!userId || !courseId) return false;
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  return !!enrollment;
}

function sanitizeLessonsForPublic(lessons) {
  return (lessons || []).map((lesson) => {
    const base = {};
    for (const key of PUBLIC_LESSON_FIELDS) {
      if (lesson[key] !== undefined) base[key] = lesson[key];
    }
    if (lesson.isPreview) {
      base.content = lesson.content ?? null;
      base.videoUrl = lesson.videoUrl ?? null;
    }
    return base;
  });
}

function canAccessFullCourse(user, enrolled) {
  return enrolled || user?.role === 'admin';
}

module.exports = {
  isUserEnrolled,
  sanitizeLessonsForPublic,
  canAccessFullCourse,
};