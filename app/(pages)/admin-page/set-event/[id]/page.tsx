import AdminHeader from "@/app/components/admin/AdminHeader";
import { AdminNavigation } from "@/app/components/admin/AdminNavigation";
import MainSection from "@/app/components/MainSection";
import { Input } from "@/app/components/ui/input";

export default function SetEvent() {
  return (
    <div>
      <div>
        <AdminHeader />
      </div>
      <div>
        <AdminNavigation />
      </div>
      <div>
        <MainSection isAdmin={true} />
      </div>
    </div>
  );
}
