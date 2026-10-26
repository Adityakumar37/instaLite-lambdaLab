const postsService = require("../services/posts.service");
const { parsePagination, formatMeta } = require("../utils/pagination");

function isValidDate(dateStr) {
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

async function create(req, res) {
  const { imageUrl, authorId, caption, location } = req.body;

  if (!imageUrl || authorId === undefined || authorId === null || authorId === "") {
    return res.status(400).json({ error: "imageUrl and authorId are required" });
  }

  const parsedAuthorId = parseInt(authorId, 10);
  if (isNaN(parsedAuthorId)) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const post = await postsService.createPost({
      imageUrl,
      authorId: parsedAuthorId,
      caption,
      location,
    });

    if (!post) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(201).json(post);
  } catch (error) {
    if (error.code === "P2003" || error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function list(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  const allowedSortBy = ["createdAt", "updatedAt", "likes"];
  const sortBy = req.query.sortBy || "createdAt";
  if (!allowedSortBy.includes(sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, updatedAt, likes" });
  }

  const order = req.query.order || "desc";
  if (order !== "asc" && order !== "desc") {
    return res.status(400).json({ error: "order must be asc or desc" });
  }

  const { from, to, location, search } = req.query;

  if (from !== undefined && !isValidDate(from)) {
    return res.status(400).json({ error: "from and to must be valid dates" });
  }

  if (to !== undefined && !isValidDate(to)) {
    return res.status(400).json({ error: "from and to must be valid dates" });
  }

  try {
    const { posts, total } = await postsService.listPosts({
      skip: pagination.skip,
      take: pagination.take,
      sortBy,
      order,
      location,
      search,
      from,
      to,
    });

    return res.status(200).json({
      data: posts,
      meta: formatMeta(total, pagination.page, pagination.limit),
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getOne(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const post = await postsService.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "Post not found" });
  }

  const { caption, location } = req.body;

  try {
    const updated = await postsService.updatePost(id, { caption, location });
    return res.status(200).json(updated);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    await postsService.deletePost(id);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getLikes(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const users = await postsService.getPostLikes(id);
    if (!users) {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
  getLikes,
};
