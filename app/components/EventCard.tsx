import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export default function EventCard() {
  return (
    <Card>
      <CardContent className="flex-col justify-items-center py-20 px-14 space-y-2">
        <CardDescription>20xx년 x월 xx일</CardDescription>
        <CardTitle>Title</CardTitle>
        <CardDescription>테스트</CardDescription>
      </CardContent>
    </Card>
  );
}
