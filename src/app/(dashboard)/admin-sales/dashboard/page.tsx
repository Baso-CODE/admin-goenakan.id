import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import SalesPerformanceDashboard from "../../components/salesPerformanceDashboard";

export const metadata = {title:"My Sales Dashboard"};
export default async function AdminSalesDashboardPage(){
  const session=await getServerSession(authOptions);
  if(!session?.user?.id)redirect("/login");
  if(session.user.role!=="ADMIN_SALES")redirect("/unauthorized");
  return <SalesPerformanceDashboard personal/>;
}
