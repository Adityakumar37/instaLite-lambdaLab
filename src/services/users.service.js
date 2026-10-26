const prisma = require("../db");

async function createUser(data) {
  return await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      fullname: data.fullname,
      bio: data.bio !== undefined ? data.bio : null,
    },
  });
}

async function listUsers({ skip, take, sortBy = "createdAt", order = "desc", isPrivate, search, hasPosts }) {
  const where = {};

  if (isPrivate !== undefined) {
    where.isPrivate = isPrivate;
  }

  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { fullname: { contains: search, mode: "insensitive" } },
    ];
  }

  if (hasPosts !== undefined) {
    if (hasPosts) {
      where.posts = { some: {} };
    } else {
      where.posts = { none: {} };
    }
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          posts: true,
          likes: true,
        },
      },
    },
  });
}

async function updateUser(id, data) {
  const updateData = {};
  if (data.fullname !== undefined) updateData.fullname = data.fullname;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;

  return await prisma.user.update({
    where: { id },
    data: updateData,
  });
}

async function deleteUser(id) {
  return await prisma.user.delete({
    where: { id },
  });
}

async function getUserPosts(id, { skip, take }) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return null;
  }

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where: { authorId: id },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        _count: {
          select: { likes: true },
        },
      },
    }),
    prisma.post.count({ where: { authorId: id } }),
  ]);

  return { posts, total };
}

async function getUserLikedPosts(id, { skip, take }) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return null;
  }

  const where = {
    likes: {
      some: {
        userId: id,
      },
    },
  };

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { posts, total };
}

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserPosts,
  getUserLikedPosts,
};
