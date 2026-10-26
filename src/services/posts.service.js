const prisma = require("../db");

async function createPost(data) {
  const user = await prisma.user.findUnique({ where: { id: data.authorId } });
  if (!user) {
    return null;
  }

  return await prisma.post.create({
    data: {
      imageUrl: data.imageUrl,
      authorId: data.authorId,
      caption: data.caption !== undefined ? data.caption : null,
      location: data.location !== undefined ? data.location : null,
    },
  });
}

async function listPosts({ skip, take, sortBy = "createdAt", order = "desc", location, search, from, to }) {
  const where = {};

  if (location) {
    where.location = {
      equals: location,
      mode: "insensitive",
    };
  }

  if (search) {
    where.caption = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (from || to) {
    where.createdAt = {};
    if (from) {
      where.createdAt.gte = new Date(from);
    }
    if (to) {
      where.createdAt.lt = new Date(to);
    }
  }

  let orderBy;
  if (sortBy === "likes") {
    orderBy = [
      { likes: { _count: order } },
      { createdAt: "desc" },
    ];
  } else {
    orderBy = { [sortBy]: order };
  }

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy,
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

async function getPostById(id) {
  return await prisma.post.findUnique({
    where: { id },
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
  });
}

async function updatePost(id, data) {
  const updateData = {};
  if (data.caption !== undefined) updateData.caption = data.caption;
  if (data.location !== undefined) updateData.location = data.location;

  return await prisma.post.update({
    where: { id },
    data: updateData,
  });
}

async function deletePost(id) {
  return await prisma.post.delete({
    where: { id },
  });
}

async function getPostLikes(id) {
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return null;
  }

  const likes = await prisma.like.findMany({
    where: { postId: id },
    select: {
      user: {
        select: {
          id: true,
          username: true,
          fullname: true,
        },
      },
    },
    orderBy: {
      user: {
        username: "asc",
      },
    },
  });

  return likes.map((l) => l.user);
}

module.exports = {
  createPost,
  listPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostLikes,
};
