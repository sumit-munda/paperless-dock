import { Prisma } from "../generated/prisma/index.js";
import prisma from "../prisma.js";
import type {
  AddCartItemInput,
  MigrateGuestCartInput,
  UpdateCartItemInput,
} from "../validation/cart.schema.js";

import { createHash } from "node:crypto";

export class CartServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "CartServiceError";
  }
}

const cartInclude = {
  items: {
    orderBy: {
      createdAt: "asc",
    },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          currency: true,
          coverImage: true,
          authors: {
            include: {
              author: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

function formatCart(cart: CartWithItems) {
  const items = cart.items.map((item) => ({
    id: item.id,
    bookId: item.bookId,
    quantity: item.quantity,
    book: {
      id: item.book.id,
      title: item.book.title,
      slug: item.book.slug,
      price: Number(item.book.price),
      currency: item.book.currency,
      coverImage: item.book.coverImage,
      author: item.book.authors.map((entry) => entry.author.name).join(", "),
    },
  }));

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

function createMigrationPayloadHash(input: MigrateGuestCartInput): string {
  const normalizedItems = [...input.items].sort((a, b) =>
    a.bookId.localeCompare(b.bookId),
  );

  return createHash("sha256")
    .update(JSON.stringify(normalizedItems))
    .digest("hex");
}

async function findCartByUserId(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: {
      userId,
    },
    include: cartInclude,
  });

  if (!cart) {
    throw new CartServiceError("Cart not found.", 404);
  }

  return cart;
}

export async function getCart(userId: string) {
  const cart = await prisma.cart.upsert({
    where: {
      userId,
    },
    update: {},
    create: {
      userId,
    },
    select: {
      id: true,
    },
  });

  const cartWithItems = await prisma.cart.findUniqueOrThrow({
    where: {
      id: cart.id,
    },
    include: cartInclude,
  });

  return formatCart(cartWithItems);
}

export async function addItemToCart(userId: string, input: AddCartItemInput) {
  const updatedCart = await prisma.$transaction(async (tx) => {
    const book = await tx.book.findFirst({
      where: {
        id: input.bookId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
    });

    if (!book) {
      throw new CartServiceError("Book not found or unavailable.", 404);
    }

    const cart = await tx.cart.upsert({
      where: {
        userId,
      },
      update: {},
      create: {
        userId,
      },
      select: {
        id: true,
      },
    });

    const existingItem = await tx.cartItem.findUnique({
      where: {
        cartId_bookId: {
          cartId: cart.id,
          bookId: book.id,
        },
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + input.quantity;

      if (newQuantity > 99) {
        throw new CartServiceError("Cart item quantity cannot exceed 99.", 400);
      }

      await tx.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: newQuantity,
        },
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          bookId: book.id,
          quantity: input.quantity,
        },
      });
    }

    return tx.cart.findUniqueOrThrow({
      where: {
        id: cart.id,
      },
      include: cartInclude,
    });
  });

  return formatCart(updatedCart);
}

export async function updateCartItem(
  userId: string,
  bookId: string,
  input: UpdateCartItemInput,
) {
  const cart = await findCartByUserId(userId);

  const result = await prisma.cartItem.updateMany({
    where: {
      cartId: cart.id,
      bookId,
    },
    data: {
      quantity: input.quantity,
    },
  });

  if (result.count === 0) {
    throw new CartServiceError("Cart item not found.", 404);
  }

  return getCart(userId);
}

export async function removeCartItem(userId: string, bookId: string) {
  const cart = await findCartByUserId(userId);

  const result = await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      bookId,
    },
  });

  if (result.count === 0) {
    throw new CartServiceError("Cart item not found.", 404);
  }

  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.upsert({
    where: {
      userId,
    },
    update: {},
    create: {
      userId,
    },
    select: {
      id: true,
    },
  });

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
    },
  });

  return getCart(userId);
}

export async function migrateGuestCart(
  userId: string,
  input: MigrateGuestCartInput,
) {
  const payloadHash = createMigrationPayloadHash(input);

  try {
    const updatedCart = await prisma.$transaction(async (tx) => {
      await tx.cartMigration.create({
        data: {
          userId,
          migrationId: input.migrationId,
          payloadHash,
        },
      });

      const books = await tx.book.findMany({
        where: {
          id: {
            in: input.items.map((item) => item.bookId),
          },
          status: "PUBLISHED",
        },
        select: {
          id: true,
        },
      });

      if (books.length !== input.items.length) {
        throw new CartServiceError("One or more books are unavailable.", 404);
      }

      const cart = await tx.cart.upsert({
        where: {
          userId,
        },
        update: {},
        create: {
          userId,
        },
        select: {
          id: true,
        },
      });

      for (const item of input.items) {
        const existingItem = await tx.cartItem.findUnique({
          where: {
            cartId_bookId: {
              cartId: cart.id,
              bookId: item.bookId,
            },
          },
          select: {
            id: true,
            quantity: true,
          },
        });

        if (existingItem) {
          const newQuantity = existingItem.quantity + item.quantity;

          if (newQuantity > 99) {
            throw new CartServiceError(
              "Cart item quantity cannot exceed 99.",
              400,
            );
          }

          await tx.cartItem.update({
            where: {
              id: existingItem.id,
            },
            data: {
              quantity: newQuantity,
            },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              bookId: item.bookId,
              quantity: item.quantity,
            },
          });
        }
      }

      return tx.cart.findUniqueOrThrow({
        where: {
          id: cart.id,
        },
        include: cartInclude,
      });
    });

    return formatCart(updatedCart);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingMigration = await prisma.cartMigration.findUnique({
        where: {
          userId_migrationId: {
            userId,
            migrationId: input.migrationId,
          },
        },
      });

      if (existingMigration) {
        if (existingMigration.payloadHash === null) {
          throw new CartServiceError(
            "This migration ID was already used, but its original payload cannot be verified.",
            409,
          );
        }

        if (existingMigration.payloadHash !== payloadHash) {
          throw new CartServiceError(
            "This migration ID has already been used with different cart items.",
            409,
          );
        }

        return getCart(userId);
      }
    }

    throw error;
  }
}
