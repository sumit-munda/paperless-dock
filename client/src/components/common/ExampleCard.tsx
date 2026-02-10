import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

const ExampleCard = () => {
  return (
    <Card className="grid gap-2 lg:grid-cols-[.75fr_1fr]">
      <CardContent className="grid grid-cols-[1fr_2fr] gap-3">
        <div>
          <div className=" text-lg font-medium ">shadcn/ui</div>
          <p className="text-sm text-muted-foreground leading-tight">
            Beautifully designed components built with Tailwind CSS.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <CardTitle>Introduction</CardTitle>
          <CardDescription>
            Re-usable components built using Radix UI and Tailwind CSS.
          </CardDescription>
          <CardAction>
            <Button variant="link">Read</Button>
          </CardAction>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExampleCard;
