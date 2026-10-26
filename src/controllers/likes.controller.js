const likesService = require("../services/likes.service");

async function add(req, res) {
  const { userId } = req.body;

  if (userId === undefined || userId === null || userId === "") {
    return res.status(400).json({ error: "userId is required" });
  }

  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) {
    return res.status(404).json({ error: "Post not found" });
  }

  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) {
    return res.status(404).json({ error: "User not found" });
  }

  const post = await likesService.checkPostExists(postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const user = await likesService.checkUserExists(parsedUserId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const like = await likesService.addLike(postId, parsedUserId);
    return res.status(201).json(like);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Already liked" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  const postId = parseInt(req.params.id, 10);
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(postId) || isNaN(userId)) {
    return res.status(404).json({ error: "Like not found" });
  }

  try {
    await likesService.removeLike(postId, userId);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Like not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  add,
  remove,
};
