import { Prisma } from "../generated/prisma/index.js";
import prisma from "../prisma.js";

export class CheckoutServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "CheckoutServiceError";
  }
}

export async function createOrder(userId: string) {
  return prisma.$transaction(async (tx) => {
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

    await tx.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT "id"
        FROM "Cart"
        WHERE "id" = ${cart.id}
        FOR UPDATE
      `,
    );

    const cartItems = await tx.cartItem.findMany({
      where: {
        cartId: cart.id,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (cartItems.length === 0) {
      throw new CheckoutServiceError("Your cart is empty.", 400);
    }

    const invalidQuantityItem = cartItems.find((item) => item.quantity !== 1);

    if (invalidQuantityItem) {
      throw new CheckoutServiceError(
        `"${invalidQuantityItem.book.title}" has an invalid quantity. Digital books can only have a quantity of 1.`,
        409,
      );
    }

    const unavailableBook = cartItems.find(
      (item) => item.book.status !== "PUBLISHED",
    );

    if (unavailableBook) {
      throw new CheckoutServiceError(
        `"${unavailableBook.book.title}" is no longer available.`,
        409,
      );
    }

    const ownedBooks = await tx.libraryItem.findMany({
      where: {
        userId,
        bookId: {
          in: cartItems.map((item) => item.bookId),
        },
      },
      select: {
        bookId: true,
      },
    });

    if (ownedBooks.length > 0) {
      const ownedBookIds = new Set(ownedBooks.map((item) => item.bookId));

      const alreadyOwnedBook = cartItems.find((item) =>
        ownedBookIds.has(item.bookId),
      );

      throw new CheckoutServiceError(
        `"${alreadyOwnedBook?.book.title}" is already in your library.`,
        409,
      );
    }

    const currencies = [
      ...new Set(cartItems.map((item) => item.book.currency)),
    ];

    if (currencies.length !== 1) {
      throw new CheckoutServiceError(
        "Your cart contains books with different currencies.",
        409,
      );
    }

    const currency = currencies[0];

    if (!currency) {
      throw new CheckoutServiceError(
        "Unable to determine order currency.",
        400,
      );
    }

    const subtotal = cartItems.reduce(
      (total, item) => total.plus(item.book.price),
      new Prisma.Decimal(0),
    );

    const order = await tx.order.create({
      data: {
        userId,
        subtotal,
        currency,
        status: "PENDING",
        paymentStatus: "PENDING",

        items: {
          create: cartItems.map((item) => ({
            bookId: item.bookId,
            titleSnapshot: item.book.title,
            priceSnapshot: item.book.price,
            quantity: 1,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return order;
  });
}
