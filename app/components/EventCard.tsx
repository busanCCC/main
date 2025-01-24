import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

type EventCardProps = {
  title: string;
  createdAt: string;
  schedule: string;
};

export default function EventCard({
  title,
  createdAt,
  schedule,
}: EventCardProps) {
  return (
    <Card>
      <CardContent className="flex-col justify-items-center py-20 px-14 space-y-2">
        <CardDescription>
          {new Date(schedule).toLocaleDateString()}
        </CardDescription>
        <CardTitle className="w-[120px] text-center text-ellipsis">
          {title}
        </CardTitle>
        <CardDescription>테스트</CardDescription>
      </CardContent>
    </Card>
  );
}
