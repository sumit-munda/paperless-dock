import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent
} from "@/components/ui/card";

const BookCard = () => {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4 space-y-3">
        {/* Book cover */}
        <div className="aspect-2/3 w-full overflow-hidden rounded-md bg-muted">
          <img
            src="src/assets/hero-poster.jpg"
            alt="Book cover"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Text content */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">John Doe</p>
          <h3 className="text-base font-semibold leading-tight">
            Introduction to Modern UI Design
          </h3>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium">$12.99</span>
          <Button size={"sm"} variant={"outline"}>
            Read
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
