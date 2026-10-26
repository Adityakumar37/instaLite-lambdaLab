const usersService = require("../services/users.service");
const { parsePagination, formatMeta } = require("../utils/pagination");

async function create(req, res) {
  const { username, email, fullname, bio } = req.body;

  if (!username || !email || !fullname) {
    return res.status(400).json({ error: "username, email and fullname are required" });
  }

  try {
    const user = await usersService.createUser({ username, email, fullname, bio });
    return res.status(201).json(user);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "username or email already taken" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function list(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  const allowedSortBy = ["createdAt", "username", "fullname"];
  const sortBy = req.query.sortBy || "createdAt";
  if (!allowedSortBy.includes(sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, username, fullname" });
  }

  const order = req.query.order || "desc";
  if (order !== "asc" && order !== "desc") {
    return res.status(400).json({ error: "order must be asc or desc" });
  }

  let isPrivate;
  if (req.query.isPrivate !== undefined) {
    if (req.query.isPrivate !== "true" && req.query.isPrivate !== "false") {
      return res.status(400).json({ error: "isPrivate must be true or false" });
    }
    isPrivate = req.query.isPrivate === "true";
  }

  let hasPosts;
  if (req.query.hasPosts !== undefined) {
    if (req.query.hasPosts !== "true" && req.query.hasPosts !== "false") {
      return res.status(400).json({ error: "hasPosts must be true or false" });
    }
    hasPosts = req.query.hasPosts === "true";
  }

  const search = req.query.search;

  try {
    const { users, total } = await usersService.listUsers({
      skip: pagination.skip,
      take: pagination.take,
      sortBy,
      order,
      isPrivate,
      search,
      hasPosts,
    });

    return res.status(200).json({
      data: users,
      meta: formatMeta(total, pagination.page, pagination.limit),
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getOne(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const user = await usersService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  const { fullname, bio, isPrivate } = req.body;

  try {
    const updated = await usersService.updateUser(id, { fullname, bio, isPrivate });
    return res.status(200).json(updated);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    await usersService.deleteUser(id);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getPosts(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  try {
    const result = await usersService.getUserPosts(id, pagination);
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      data: result.posts,
      meta: formatMeta(result.total, pagination.page, pagination.limit),
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getLikedPosts(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  try {
    const result = await usersService.getUserLikedPosts(id, pagination);
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      data: result.posts,
      meta: formatMeta(result.total, pagination.page, pagination.limit),
    });
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
  getPosts,
  getLikedPosts,
};
