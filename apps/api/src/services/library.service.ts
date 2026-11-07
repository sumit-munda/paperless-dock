import prisma from "../prisma.js";

export async function getUserLibrary(userId: string) {
  const libraryItems = await prisma.libraryItem.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      purchasedAt: true,

      book: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          language: true,
          pageCount: true,
          contentReference: true,

          authors: {
            select: {
              author: {
                select: {
                  name: true,
                },
              },
            },
          },

          categories: {
            select: {
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },

    orderBy: {
      purchasedAt: "desc",
    },
  });

  const readingProgress = await prisma.readingProgress.findMany({
    where: {
      userId,
    },

    select: {
      bookId: true,
      position: true,
      percentage: true,
      lastReadAt: true,
    },
  });

  const progressMap = new Map(
    readingProgress.map((progress) => [progress.bookId, progress]),
  );

  return libraryItems.map((item) => {
    const progress = progressMap.get(item.book.id);

    return {
      id: item.id,
      purchasedAt: item.purchasedAt,

      book: {
        id: item.book.id,
        title: item.book.title,
        slug: item.book.slug,
        description: item.book.description,
        coverImage: item.book.coverImage ?? "",
        language: item.book.language,
        pageCount: item.book.pageCount,
        hasContent: Boolean(item.book.contentReference),

        authors: item.book.authors.map((item) => item.author.name),

        categories: item.book.categories.map((item) => item.category.name),
      },

      readingProgress: {
        position: progress?.position ?? "start",
        percentage: progress?.percentage ?? 0,
        lastReadAt: progress?.lastReadAt ?? null,
      },
    };
  });
}
