"use client";

import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import ChangeSalesOwnerDialog from "./changeSalesOwnerDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown, BarChart3, CalendarDays, CheckCircle2, Clock, FileText, Info, Loader2, Receipt, ShoppingBag, Target, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Seller = {id:string;name:string};
type Metrics = {
  totalSales:number; salesOrders:number; sampleOrders:number; averageOrderValue:number|null;
  grossPaidInvoices:number; outstandingInvoices:number;
  totalCustomers:number; newCustomers:number; returningCustomers:number;
  totalQuotation:number; draft:number; sent:number; accepted:number; rejected:number;
  acceptanceRate:number|null; convertedToSample:number; convertedToSales:number;
  sampleConversionRate:number|null; salesConversionRate:number|null;
  avgSendingLeadTime:number|null; avgClosingLeadTime:number|null; sendingLeadTimeCount:number; closingLeadTimeCount:number;
};
type Leader = Seller & Metrics;
type AnalyticsData = {
  scope:"team"|"personal"; sellers:Seller[]; chartSellers:Seller[]; currency:string; currencies:string[];
  metrics:Metrics; leaderboard:Leader[];
  months:{month:string;label:string;amounts:Record<string,number>;salesOrders:number}[];
  channels:{name:string;value:number}[];
  dataQuality:{unassignedOrders:number;unassignedQuotations:number;otherOwnerOrders:number;otherOwnerQuotations:number}|null;
  ownershipQueue:{type:"order"|"quotation";id:string;number:string;date:string;createdBy:string|null}[];
  period:{start:string;end:string}; generatedAt:string;
};
type Filter = {range:string;startDate:string;endDate:string;sellerId:string;currency:string};
const INITIAL:Filter={range:"30days",startDate:"",endDate:"",sellerId:"all",currency:"auto"};
const COLORS=["#2563eb","#14b8a6","#f59e0b","#8b5cf6","#ec4899","#0ea5e9","#65a30d","#f97316","#6366f1","#64748b"];
const color=(i:number)=>COLORS[i]??`hsl(${(i*137.508)%360}, 65%, 45%)`;
const count=(n:number)=>new Intl.NumberFormat("en-US").format(n);
const money=(n:number,currency:string,compact=false)=>new Intl.NumberFormat("en-US",{style:"currency",currency,notation:compact?"compact":"standard",maximumFractionDigits:compact?1:2}).format(n);
const pct=(n:number|null)=>n===null?"—":`${n.toFixed(1)}%`;
const duration=(n:number|null)=>n===null?"—":`${n.toFixed(1)} days`;
const dateLabel=(s:string)=>new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Jakarta"}).format(new Date(s));

function Metric({title,value,detail,icon:Icon}:{title:string;value:string;detail:string;icon:LucideIcon}){
  return <Card className="min-w-0 gap-2 shadow-sm"><CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle><span className="rounded-lg bg-muted p-2"><Icon className="h-4 w-4 text-blue-600"/></span></CardHeader><CardContent className="space-y-2"><div className="break-words text-2xl font-bold tracking-tight tabular-nums" title={value}>{value}</div><p className="text-xs leading-relaxed text-muted-foreground">{detail}</p></CardContent></Card>;
}

const COLUMNS: {key:"name"|"totalSales"|"salesOrders"|"sampleOrders"|"totalQuotation"|"salesConversionRate"|"newCustomers"|"grossPaidInvoices"; label:string}[] = [
  {key:"name",label:"Sales"},{key:"totalSales",label:"Total Sales"},{key:"salesOrders",label:"Sales Orders"},{key:"sampleOrders",label:"Sample"},{key:"totalQuotation",label:"Quotation"},{key:"salesConversionRate",label:"Conversion"},{key:"newCustomers",label:"New Customers"},{key:"grossPaidInvoices",label:"Gross Paid Invoices"},
];
function Leaderboard({rows,currency,onSelect}:{rows:Leader[];currency:string;onSelect:(id:string)=>void}){
  const [sort,setSort]=useState<{key:(typeof COLUMNS)[number]["key"];direction:1|-1}>({key:"totalSales",direction:-1});
  const sorted=useMemo(()=>[...rows].sort((a,b)=>{
    const x=a[sort.key],y=b[sort.key];
    if(x===null || y===null){if(x===y)return a.name.localeCompare(b.name);return x===null?1:-1;}
    const delta=typeof x==="string"&&typeof y==="string"?x.localeCompare(y):Number(x)-Number(y);
    return delta*sort.direction || a.name.localeCompare(b.name);
  }),[rows,sort]);
  return <Card className="min-w-0"><CardHeader><CardTitle>Sales Performance Leaderboard</CardTitle><p className="text-xs text-muted-foreground">Klik judul kolom untuk sorting atau nama Sales untuk melihat detail performanya.</p></CardHeader><CardContent><div className="overflow-x-auto rounded-lg border"><Table className="min-w-[930px]"><TableHeader><TableRow>{COLUMNS.map(c=>{const Icon=sort.key===c.key?(sort.direction===1?ArrowUp:ArrowDown):ArrowUpDown;return <TableHead key={c.key} aria-sort={sort.key===c.key?(sort.direction===1?"ascending":"descending"):"none"}><button type="button" className="flex w-full items-center gap-1.5 whitespace-nowrap text-xs font-semibold" onClick={()=>setSort(old=>({key:c.key,direction:old.key===c.key?(old.direction===1?-1:1):c.key==="name"?1:-1}))}>{c.label}<Icon className="h-3.5 w-3.5"/></button></TableHead>})}</TableRow></TableHeader><TableBody>{sorted.length?sorted.map(r=><TableRow key={r.id}><TableCell><button type="button" onClick={()=>onSelect(r.id)} className="font-medium text-blue-600 hover:underline">{r.name}</button></TableCell><TableCell className="whitespace-nowrap tabular-nums">{money(r.totalSales,currency)}</TableCell><TableCell>{count(r.salesOrders)}</TableCell><TableCell>{count(r.sampleOrders)}</TableCell><TableCell>{count(r.totalQuotation)}</TableCell><TableCell>{pct(r.salesConversionRate)}</TableCell><TableCell>{count(r.newCustomers)}</TableCell><TableCell className="whitespace-nowrap tabular-nums">{money(r.grossPaidInvoices,currency)}</TableCell></TableRow>):<TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Belum ada Admin Sales.</TableCell></TableRow>}</TableBody></Table></div></CardContent></Card>;
}

export default function SalesPerformanceDashboard({personal=false}:{personal?:boolean}){
  const {fetchApi,status}=useApi();
  const [draft,setDraft]=useState<Filter>({...INITIAL});
  const [applied,setApplied]=useState<Filter>({...INITIAL});
  const [data,setData]=useState<AnalyticsData|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [filterError,setFilterError]=useState<string|null>(null);
  useEffect(()=>{
    if(status!=="authenticated")return;
    let active=true;const controller=new AbortController();
    setLoading(true);setError(null);
    const params=new URLSearchParams({range:applied.range});
    if(applied.range==="custom"){params.set("startDate",applied.startDate);params.set("endDate",applied.endDate);}
    if(applied.currency!=="auto")params.set("currency",applied.currency);
    if(!personal&&applied.sellerId!=="all")params.set("salesUserId",applied.sellerId);
    const endpoint=personal?"/analytics/sales-performance/me":"/analytics/sales-performance";
    (async()=>{try{const res=await fetchApi(`${endpoint}?${params}`,{signal:controller.signal});const json=await res.json();if(!res.ok||!json.success||!json.data)throw new Error(json.message||"Gagal memuat Sales Performance");if(active)setData(json.data);}catch(e){if(active)setError(e instanceof Error?e.message:"Gagal memuat data");}finally{if(active)setLoading(false);}})();
    return()=>{active=false;controller.abort();};
  },[applied,personal,fetchApi,status]);
  const apply=()=>{
    setFilterError(null);
    if(draft.range==="custom"&&(!draft.startDate||!draft.endDate||draft.startDate>draft.endDate)){setFilterError("Isi rentang tanggal yang valid.");return;}
    if(draft.range==="custom"&&(Date.parse(draft.endDate)-Date.parse(draft.startDate))/86400000>366){setFilterError("Custom range maksimal 366 hari.");return;}
    setApplied({...draft});
  };
  const selectSeller=(id:string)=>{const next={...applied,sellerId:id};setDraft(next);setApplied(next);};
  const chartData=useMemo(()=>(data?.months??[]).map(m=>({month:m.month,label:m.label,...m.amounts})),[data]);
  const m=data?.metrics;
  const currency=data?.currency??"IDR";
  return <div className="mt-6 min-w-0 space-y-6 pb-10 animate-in fade-in duration-500">
    <div className="flex items-center gap-3"><div className="rounded-xl border bg-blue-50 p-3 dark:bg-blue-950/40"><BarChart3 className="h-6 w-6 text-blue-600"/></div><div><h2 className="text-xl font-bold tracking-tight">{personal?"My Sales Dashboard":"Sales Performance"}</h2><p className="text-sm text-muted-foreground">{personal?"Pantau performa penjualan pribadi.":"Monitor dan bandingkan performa setiap Admin Sales."}</p></div></div>
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center gap-2 self-center"><CalendarDays className="h-4 w-4 text-muted-foreground"/><span className="text-sm font-medium">Date Filter</span></div>
      <div className="w-full sm:w-44"><label className="text-xs text-muted-foreground">Period</label><Select value={draft.range} onValueChange={range=>setDraft(v=>({...v,range}))}><SelectTrigger className="bg-background"><SelectValue/></SelectTrigger><SelectContent>{[["today","Today"],["7days","Last 7 Days"],["14days","Last 14 Days"],["30days","Last 30 Days"],["90days","Last 90 Days"],["1year","Last 1 Year"],["custom","Custom Range"]].map(([value,label])=><SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
      {draft.range==="custom"&&<><div><label className="text-xs text-muted-foreground">Start Date</label><Input type="date" aria-label="Start Date" value={draft.startDate} max={draft.endDate||undefined} onChange={e=>setDraft(v=>({...v,startDate:e.target.value}))}/></div><div><label className="text-xs text-muted-foreground">End Date</label><Input type="date" aria-label="End Date" value={draft.endDate} min={draft.startDate||undefined} onChange={e=>setDraft(v=>({...v,endDate:e.target.value}))}/></div></>}
      {!personal&&<div className="w-full sm:w-48"><label className="text-xs text-muted-foreground">Sales</label><Select value={draft.sellerId} onValueChange={sellerId=>setDraft(v=>({...v,sellerId}))}><SelectTrigger className="bg-background"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All Admin Sales</SelectItem>{(data?.sellers??[]).map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>}
      <div className="w-full sm:w-32"><label className="text-xs text-muted-foreground">Currency</label><Select value={draft.currency} onValueChange={currency=>setDraft(v=>({...v,currency}))}><SelectTrigger className="bg-background"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="auto">Auto</SelectItem>{[...new Set([...(data?.currencies??[]),...(draft.currency!=="auto"?[draft.currency]:[])])].map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
      <Button onClick={apply} disabled={loading}>Apply Filter</Button>
    </div>
    {filterError&&<p role="alert" className="rounded-lg border border-amber-200 p-3 text-sm text-amber-700">{filterError}</p>}
    {loading?<div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground"><Loader2 className="h-7 w-7 animate-spin"/>Memuat Sales Performance...</div>:error?<div role="alert" className="rounded-lg border border-red-200 p-4 text-sm text-red-600">{error}<Button variant="outline" size="sm" className="ml-3" onClick={()=>setApplied(v=>({...v}))}>Retry</Button></div>:data&&m&&<>
      <p className="text-xs text-muted-foreground">{dateLabel(data.period.start)} – {dateLabel(data.period.end)} · {currency} · {personal?"Personal":applied.sellerId==="all"?"All Admin Sales":data.sellers.find(s=>s.id===applied.sellerId)?.name}</p>
      <section className="space-y-3"><h3 className="font-semibold">Sales Overview</h3><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total Sales" value={money(m.totalSales,currency)} detail="Nilai SALES Order non-CANCELLED" icon={Wallet}/>
        <Metric title="Sales Orders" value={count(m.salesOrders)} detail="Seluruh mata uang" icon={ShoppingBag}/>
        <Metric title="Sample Orders" value={count(m.sampleOrders)} detail="Order kategori SAMPLE" icon={FileText}/>
        <Metric title="Average Order Value" value={m.averageOrderValue===null?"—":money(m.averageOrderValue,currency)} detail={`Rata-rata Sales Order dalam ${currency}`} icon={BarChart3}/>
        <Metric title="Gross Paid Invoices" value={money(m.grossPaidInvoices,currency)} detail="Nilai Invoice PAID berdasarkan tanggal bayar, sebelum refund" icon={CheckCircle2}/>
        <Metric title="Outstanding Invoices" value={money(m.outstandingInvoices,currency)} detail="Invoice terbit dalam periode, kini UNPAID / OVERDUE" icon={Receipt}/>
        <Metric title="Active Customers" value={count(m.totalCustomers)} detail="Client unik dengan Sales Order" icon={Users}/>
        <Metric title="New / Returning" value={`${count(m.newCustomers)} / ${count(m.returningCustomers)}`} detail="Berdasarkan first-ever Sales Order perusahaan" icon={Users}/>
      </div></section>
      <section className="space-y-3"><h3 className="font-semibold">Quotation Performance</h3><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Quotation Created" value={count(m.totalQuotation)} detail={`Draft ${count(m.draft)} · Sent ${count(m.sent)} · Accepted ${count(m.accepted)} · Rejected ${count(m.rejected)}`} icon={FileText}/>
        <Metric title="Acceptance Rate" value={pct(m.acceptanceRate)} detail={`${count(m.accepted)} Quotation berstatus Accepted saat ini`} icon={CheckCircle2}/>
        <Metric title="Sample Conversion" value={pct(m.sampleConversionRate)} detail={`${count(m.convertedToSample)} Quotation unik menghasilkan Sample Order`} icon={Target}/>
        <Metric title="Sales Conversion" value={pct(m.salesConversionRate)} detail={`${count(m.convertedToSales)} Quotation unik menghasilkan Sales Order`} icon={Target}/>
        <Metric title="Average Sending Lead Time" value={duration(m.avgSendingLeadTime)} detail={`${m.sendingLeadTimeCount} Quotation dengan milestone valid`} icon={Clock}/>
        <Metric title="Average Closing Lead Time" value={duration(m.avgClosingLeadTime)} detail={`${m.closingLeadTimeCount} Quotation: accepted → Sales Order`} icon={Clock}/>
      </div></section>
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="min-w-0"><CardHeader><CardTitle>Monthly Sales Performance</CardTitle><p className="text-xs text-muted-foreground">Nilai Sales Order per bulan ({currency})</p></CardHeader><CardContent><div className="h-[340px] w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{top:10,right:8,left:8,bottom:8}}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="label" tick={{fontSize:11}}/><YAxis width={90} tickFormatter={v=>money(Number(v),currency,true)} tick={{fontSize:11}}/><Tooltip formatter={v=>money(Number(v),currency)} contentStyle={{borderRadius:8,fontSize:12,color:"#0f172a"}}/><Legend wrapperStyle={{fontSize:11}}/>{data.chartSellers.map((s,i)=><Bar key={s.id} dataKey={`sales_${s.id}`} name={s.name} stackId="sales" fill={color(i)} maxBarSize={64}/>)}</BarChart></ResponsiveContainer></div></CardContent></Card>
        <Card className="min-w-0"><CardHeader><CardTitle>Order by Purchase Channel</CardTitle><p className="text-xs text-muted-foreground">Jumlah Sales Order, seluruh mata uang.</p></CardHeader><CardContent>{data.channels.length?<><div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.channels} nameKey="name" dataKey="value" innerRadius="52%" outerRadius="78%" paddingAngle={2}>{data.channels.map((c,i)=><Cell key={c.name} fill={color(i)}/>)}</Pie><Tooltip contentStyle={{color:"#0f172a"}}/></PieChart></ResponsiveContainer></div><div className="space-y-2">{data.channels.map((c,i)=><div key={c.name} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor:color(i)}}/><span className="min-w-0 flex-1 truncate" title={c.name}>{c.name}</span><span className="tabular-nums">{count(c.value)} ({m.salesOrders?(c.value/m.salesOrders*100).toFixed(1):0}%)</span></div>)}</div></>:<p className="py-16 text-center text-sm text-muted-foreground">Belum ada Order.</p>}</CardContent></Card>
      </div>
      {!personal&&<Leaderboard rows={data.leaderboard} currency={currency} onSelect={selectSeller}/>}
      {!personal&&data.dataQuality&&<Card className="border-amber-200"><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Info className="h-4 w-4 text-amber-600"/>Sales Ownership Coverage</CardTitle></CardHeader><CardContent className="space-y-2 text-xs text-muted-foreground"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Unassigned Orders",data.dataQuality.unassignedOrders],["Unassigned Quotations",data.dataQuality.unassignedQuotations],["Other Owner Orders",data.dataQuality.otherOwnerOrders],["Other Owner Quotations",data.dataQuality.otherOwnerQuotations]].map(([label,value])=><div key={label} className="rounded-lg border p-3"><p>{label}</p><p className="mt-1 text-xl font-semibold text-foreground">{value}</p></div>)}</div><p>Data ini mencakup seluruh perusahaan pada periode terpilih, bukan filter individu. Owner kosong atau bukan ADMIN_SALES saat ini tidak masuk leaderboard. Gunakan Change Sales Owner pada detail Order atau Quotation untuk memperbaiki atribusi yang terverifikasi.</p></CardContent></Card>}
      {!personal && (data.ownershipQueue?.length ?? 0)>0 && <Card className="min-w-0"><CardHeader><CardTitle>Unassigned Documents</CardTitle><p className="text-xs text-muted-foreground">Maksimal 15 Order dan 15 Quotation terbaru tanpa owner dalam periode. Pembuat hanya informasi referensi, bukan penetapan otomatis.</p></CardHeader><CardContent><div className="overflow-x-auto rounded-lg border"><Table className="min-w-[720px]"><TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Number</TableHead><TableHead>Date</TableHead><TableHead>Created By</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{data.ownershipQueue.map(row=><TableRow key={`${row.type}-${row.id}`}><TableCell className="capitalize">{row.type}</TableCell><TableCell className="font-medium">{row.number}</TableCell><TableCell className="whitespace-nowrap">{dateLabel(row.date)}</TableCell><TableCell>{row.createdBy||"—"}</TableCell><TableCell><ChangeSalesOwnerDialog documentType={row.type} documentId={row.id} onSaved={()=>setApplied(v=>({...v}))}/></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>}
      <p className="text-xs leading-relaxed text-muted-foreground">Nilai uang mengikuti mata uang terpilih tanpa konversi kurs; jumlah Order, Customer, dan Quotation mencakup semua mata uang. Order menggunakan dateOrder, Quotation menggunakan createdAt; konversi mengikuti referensi Quotation langsung hingga saat ini. Nilai pembayaran adalah nominal Invoice PAID, bukan penerimaan bersih setelah refund. Lead time lama tanpa milestone tidak diperkirakan. Kepemilikan menggunakan owner saat ini, bukan penandatangan.</p>
    </>}
  </div>;
}
