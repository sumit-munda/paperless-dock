import prisma from "../prisma.js";

export async function getOrderById(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      userId: true,
      subtotal: true,
      currency: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          bookId: true,
          titleSnapshot: true,
          priceSnapshot: true,
          quantity: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}
