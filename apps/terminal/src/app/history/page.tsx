import { redirect } from "next/navigation";

export default function HistoryPage() {
  redirect("/accounts?tab=archived");
}
