"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { UserRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Ownership = {salesUserId:string|null;currentOwner:string|null;users:{id:string;name:string}[]};
const UNASSIGNED="__unassigned__";
const ENDPOINT="/analytics/sales-performance/ownership";
export default function ChangeSalesOwnerDialog({documentType,documentId,onSaved}:{documentType:"order"|"quotation";documentId:string;onSaved?:()=>void}){
  const {data:session}=useSession();const {fetchApi,status}=useApi();
  const allowed=session?.user?.role==="SUPER_ADMIN";
  const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false);
  const [data,setData]=useState<Ownership|null>(null),[selected,setSelected]=useState(UNASSIGNED),[reason,setReason]=useState(""),[error,setError]=useState<string|null>(null);
  useEffect(()=>{if(!open||!allowed||status!=="authenticated")return;let active=true;const controller=new AbortController();setLoading(true);setData(null);setError(null);setReason("");(async()=>{try{const params=new URLSearchParams({documentType,documentId});const res=await fetchApi(`${ENDPOINT}?${params}`,{signal:controller.signal});const json=await res.json();if(!res.ok||!json.success)throw new Error(json.message||"Gagal memuat Sales Owner");if(active){setData(json.data);setSelected(json.data.salesUserId??UNASSIGNED);}}catch(e){if(active)setError(e instanceof Error?e.message:"Gagal memuat data");}finally{if(active)setLoading(false);}})();return()=>{active=false;controller.abort();};},[open,allowed,status,documentType,documentId,fetchApi]);
  const next=selected===UNASSIGNED?null:selected;
  const valid=!!data&&!loading&&!saving&&next!==data.salesUserId&&(next===null||data.users.some(u=>u.id===next))&&reason.trim().length>=10&&reason.trim().length<=500;
  const save=async()=>{if(!data||!valid)return;setSaving(true);try{const res=await fetchApi(ENDPOINT,{method:"PATCH",body:JSON.stringify({documentType,documentId,salesUserId:next,expectedSalesUserId:data.salesUserId,reason:reason.trim()})});const json=await res.json();if(!res.ok||!json.success)throw new Error(json.message||"Gagal menyimpan Sales Owner");toast.success("Sales Owner diperbarui");setOpen(false);onSaved?.();}catch(e){setError(e instanceof Error?e.message:"Gagal menyimpan data");}finally{setSaving(false);}};
  if(!allowed)return null;
  return <Dialog open={open} onOpenChange={value=>{if(!saving)setOpen(value);}}><DialogTrigger asChild><Button variant="outline" className="gap-2"><UserRound className="h-4 w-4"/>Change Sales Owner</Button></DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Change Sales Owner</DialogTitle><DialogDescription>Ubah kredit performa Sales untuk {documentType}. Penandatangan, pembuat, dan nilai dokumen tidak berubah.</DialogDescription></DialogHeader>{loading?<div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin"/></div>:data&&<div className="space-y-4"><div className="rounded-lg border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Current Sales Owner</p><p className="font-medium">{data.currentOwner||"Unassigned"}</p></div><div className="space-y-2"><p className="text-sm font-medium">New Sales Owner</p><Select value={selected} onValueChange={setSelected} disabled={saving}><SelectTrigger><SelectValue placeholder="Select Sales"/></SelectTrigger><SelectContent><SelectItem value={UNASSIGNED}>Unassigned</SelectItem>{data.salesUserId&&!data.users.some(u=>u.id===data.salesUserId)&&<SelectItem value={data.salesUserId} disabled>{data.currentOwner||"Previous owner"} (not ADMIN_SALES)</SelectItem>}{data.users.map(u=><SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><p className="text-sm font-medium">Alasan (10–500 karakter)</p><Textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={500} disabled={saving} placeholder="Jelaskan alasan pengalihan Sales Owner"/></div><p className="text-xs text-amber-700 dark:text-amber-300">Perubahan dicatat dalam audit dan dapat mengubah laporan performa historis. Dokumen lain yang terhubung tidak otomatis berpindah owner.</p></div>}{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}<DialogFooter><Button variant="outline" onClick={()=>setOpen(false)} disabled={saving}>Cancel</Button><Button onClick={save} disabled={!valid}>{saving&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Sales Owner</Button></DialogFooter></DialogContent></Dialog>;
}
