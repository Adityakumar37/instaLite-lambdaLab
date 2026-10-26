require("dotenv").config();
const express = require("express");
const usersRoutes = require("./routes/users.routes");
const postsRoutes = require("./routes/posts.routes");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use("/users", usersRoutes);
app.use("/posts", postsRoutes);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
}

module.exports = app;
