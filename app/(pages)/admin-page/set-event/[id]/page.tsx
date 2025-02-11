import AdminHeader from "@/app/components/admin/AdminHeader";
import { AdminNavigation } from "@/app/components/admin/AdminNavigation";
import MainSection from "@/app/components/MainSection";
import SetEventList from "@/app/components/set-event/setEventList";
import SetSection from "@/app/components/set-event/setSection";
import { Input } from "@/app/components/ui/input";

export default function SetEvent({ params }: { params: { id: string } }) {
  return (
    <div>
      <div>
        <AdminHeader />
      </div>
      <div>
        <AdminNavigation />
      </div>
      <div>
        <SetSection id={parseInt(params.id)} />
      </div>
    </div>
  );
}
