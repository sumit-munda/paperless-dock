export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  price: number;
  coverImage: string;
  rating: number;
}

export const books: Book[] = [
  {
    id: "book-001",
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Development",
    description:
      "A practical guide to building good habits and breaking bad ones.",
    price: 499,
    coverImage: "https://placehold.co/300x420?text=Atomic+Habits",
    rating: 4.8,
  },
  {
    id: "book-002",
    title: "Deep Work",
    author: "Cal Newport",
    category: "Productivity",
    description:
      "Learn how focused work can help you produce valuable results.",
    price: 399,
    coverImage: "https://placehold.co/300x420?text=Deep+Work",
    rating: 4.6,
  },
  {
    id: "book-003",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    category: "Finance",
    description:
      "Explore how people think about money, risk, and financial decisions.",
    price: 349,
    coverImage: "https://placehold.co/300x420?text=Psychology+of+Money",
    rating: 4.7,
  },
];
