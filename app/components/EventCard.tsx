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
};

export default function EventCard({
  title,
  createdAt,
  schedule,
  className,
}: EventCardProps) {
  return (
    <Card className={`max-h-48 h-48 aspect-square flex-auto rounded-2xl`}>
      <CardContent className={`flex flex-col justify-center items-center space-y-2 w-full h-full ${className}`}>
        <CardDescription className="text-center line-clamp-1">{title}</CardDescription>
        <CardTitle className="text-center font-medium break-words">
        인제대 섬김 채플
        </CardTitle>
      </CardContent>
    </Card>
  );
}
