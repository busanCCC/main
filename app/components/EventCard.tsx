import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/app/components/ui/card";

type EventCardProps = {
  title: string;
  createdAt: string;
  schedule: string;
  className?: string;
  subTitle?: string;
};

export default function EventCard({
  title,
  createdAt,
  schedule,
  className,
  subTitle,
}: EventCardProps) {
  return (
    <Card
      className={`sm:min-h-80 md:min-h-92 lg:min-h-92 h-80 aspect-square flex-auto rounded-2xl ${className}`}
    >
      <CardContent
        className={`flex flex-col justify-center items-center space-y-2 w-full h-full`}
      >
        <CardDescription className="text-center line-clamp-1">
          {title}
        </CardDescription>
        <CardTitle className="text-center font-medium break-words">
          {subTitle}
        </CardTitle>
      </CardContent>
    </Card>
  );
}
