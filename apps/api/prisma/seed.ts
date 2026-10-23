import { PrismaClient } from "../src/generated/prisma/client.js";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const environmentFilePath = resolve(currentDirectory, "../.env");

dotenv.config({ path: environmentFilePath });

const prisma = new PrismaClient();

const books = [
  {
    id: "book-001",
    title: "Atomic Habits",
    slug: "atomic-habits",
    description:
      "A practical guide to building good habits and breaking bad ones.",
    coverImage: "https://placehold.co/300x420?text=Atomic+Habits",
    price: "499.00",
    rating: 4.8,
    author: {
      name: "James Clear",
      slug: "james-clear",
    },
    category: {
      name: "Self-Development",
      slug: "self-development",
      description: "Books about personal growth and habit development.",
    },
  },
  {
    id: "book-002",
    title: "Deep Work",
    slug: "deep-work",
    description:
      "Learn how focused work can help you produce valuable results.",
    coverImage: "https://placehold.co/300x420?text=Deep+Work",
    price: "399.00",
    rating: 4.6,
    author: {
      name: "Cal Newport",
      slug: "cal-newport",
    },
    category: {
      name: "Productivity",
      slug: "productivity",
      description: "Books about focus, productivity, and effective work.",
    },
  },
  {
    id: "book-003",
    title: "The Psychology of Money",
    slug: "the-psychology-of-money",
    description:
      "Explore how people think about money, risk, and financial decisions.",
    coverImage: "https://placehold.co/300x420?text=Psychology+of+Money",
    price: "349.00",
    rating: 4.7,
    author: {
      name: "Morgan Housel",
      slug: "morgan-housel",
    },
    category: {
      name: "Finance",
      slug: "finance",
      description: "Books about money, finance, and financial decisions.",
    },
  },
];

// Asynchronous function that seeds the database.

async function main() {
  for (const bookData of books) {
    const author = await prisma.author.upsert({
      where: { slug: bookData.author.slug },
      update: { name: bookData.author.name },
      create: bookData.author,
    });

    const category = await prisma.category.upsert({
      where: { slug: bookData.category.slug },
      update: {
        name: bookData.category.name,
        description: bookData.category.description,
      },
      create: bookData.category,
    });

    await prisma.book.upsert({
      where: { id: bookData.id },
      update: {
        title: bookData.title,
        slug: bookData.slug,
        description: bookData.description,
        coverImage: bookData.coverImage,
        price: bookData.price,
        currency: "INR",
        language: "en",
        status: "PUBLISHED",
        rating: bookData.rating,
        authors: {
          set: [
            { bookId_authorId: { bookId: bookData.id, authorId: author.id } },
          ],
        },
        categories: {
          set: [
            {
              bookId_categoryId: {
                bookId: bookData.id,
                categoryId: category.id,
              },
            },
          ],
        },
      },
      create: {
        id: bookData.id,
        title: bookData.title,
        slug: bookData.slug,
        description: bookData.description,
        coverImage: bookData.coverImage,
        price: bookData.price,
        currency: "INR",
        language: "en",
        status: "PUBLISHED",
        rating: bookData.rating,
        authors: {
          create: { author: { connect: { id: author.id } } },
        },
        categories: {
          create: { category: { connect: { id: category.id } } },
        },
      },
    });

    console.log(`Seeded book: ${bookData.title}`);
  }

  console.log("Database seeding completed successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })

  .finally(async () => {
    await prisma.$disconnect();
  });
