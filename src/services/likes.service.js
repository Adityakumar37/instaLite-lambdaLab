const prisma = require("../db");

async function checkPostExists(postId) {
  return await prisma.post.findUnique({ where: { id: postId } });
}

async function checkUserExists(userId) {
  return await prisma.user.findUnique({ where: { id: userId } });
}

async function addLike(postId, userId) {
  return await prisma.like.create({
    data: {
      postId,
      userId,
    },
  });
}

async function removeLike(postId, userId) {
  return await prisma.like.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
}

module.exports = {
  checkPostExists,
  checkUserExists,
  addLike,
  removeLike,
};
