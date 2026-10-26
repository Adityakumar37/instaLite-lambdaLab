const prisma = require("../src/db");
const { users, posts, likes } = require("./seed-data");

async function main() {
  try {
    // 1. Delete all rows, children first
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    // 2. Create users
    const createdUsers = await prisma.user.createManyAndReturn({
      data: users.map((u) => ({
        username: u.username,
        email: u.email,
        fullname: u.fullname,
        bio: u.bio,
        isPrivate: u.isPrivate,
        createdAt: new Date(u.createdAt),
      })),
    });

    // 3. Username to id lookup
    const userMap = {};
    for (const u of createdUsers) {
      userMap[u.username] = u.id;
    }

    // 4. Create posts with real authorId
    const createdPosts = await prisma.post.createManyAndReturn({
      data: posts.map((p) => ({
        authorId: userMap[p.author],
        imageUrl: p.imageUrl,
        caption: p.caption,
        location: p.location,
        createdAt: new Date(p.createdAt),
      })),
    });

    // 5. Post key (insta##) to id lookup
    const postMap = {};
    for (const p of createdPosts) {
      const parts = p.imageUrl.split("/");
      const key = parts[4]; // "insta01", etc.
      postMap[key] = p.id;
    }

    // 6. Create likes
    const createdLikes = await prisma.like.createMany({
      data: likes.map((l) => ({
        userId: userMap[l.user],
        postId: postMap[l.post],
      })),
    });

    // 7. Output result
    console.log(
      `🌱 Seeded ${createdUsers.length} users, ${createdPosts.length} posts and ${createdLikes.count} likes`
    );
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
