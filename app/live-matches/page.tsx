import type { Metadata } from "next";
import MatchesDashboard from "@/components/MatchesDashboard";

export const metadata: Metadata = {
  title: "مباريات اليوم | لوحة المباريات",
  description:
    "تابع نتائج مباريات اليوم مباشرة مع معرفة المعلقين والنتائج لحظة بلحظة",
};

export default function LiveMatchesPage() {
  return (
    <div dir="rtl" lang="ar" className="font-sans">
      <MatchesDashboard />
    </div>
  );
}
