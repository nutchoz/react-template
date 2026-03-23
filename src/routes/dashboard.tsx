import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
    BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    // Container, Truck, Ship, Building2, DoorOpen, Clock,
    Container, Truck, Ship, DoorOpen, Clock,
    CreditCard, Activity, LayoutDashboard, ArrowUpRight,
    ArrowDownRight, FileBarChart2, Calendar, CalendarDays,
    CalendarRange, Download, Printer, FileSpreadsheet,
    TrendingUp, CheckCircle2, AlertCircle, ChevronLeft,
    ChevronRight, Banknote, WalletCards, CircleDollarSign, Users,
} from 'lucide-react';
import {
    fetchDashboardData,
    filterByRange,
    startOf,
    endOf,
    computePaymentSummary,
    type DashboardData,
    type GateEntry,
} from '../lib/utilities/dashboard_fetch';

// ─── Constants ─────────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'reports';
type ReportPeriod = 'daily' | 'weekly' | 'monthly';
const ORANGE = '#f97316';
const DARK   = '#0f172a';
const PAYMENT_METHODS = ['CASH', 'BANK TRANSFER', 'CHECK', 'GCASH'];
const fmt = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtShort = (n: number) =>
    n >= 1_000_000 ? `₱${(n/1_000_000).toFixed(2)}M` : n >= 1_000 ? `₱${(n/1_000).toFixed(1)}K` : `₱${Math.round(n)}`;

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}
function DashboardSkeleton() {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><Skeleton key={i} className="h-28"/>)}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-64 md:col-span-2"/><Skeleton className="h-64"/></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-64 md:col-span-2"/><Skeleton className="h-64"/></div>
        </div>
    );
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
    const map: Record<string,string> = {
        paid:'bg-emerald-50 text-emerald-700 border-emerald-200', unpaid:'bg-amber-50 text-amber-700 border-amber-200',
        active:'bg-emerald-50 text-emerald-700 border-emerald-200', banned:'bg-red-50 text-red-700 border-red-200',
        deceased:'bg-slate-100 text-slate-500 border-slate-200', Active:'bg-emerald-50 text-emerald-700 border-emerald-200',
        Inactive:'bg-slate-100 text-slate-500 border-slate-200',
    };
    return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${map[status]??'bg-slate-100 text-slate-500 border-slate-200'}`}>{status}</span>;
}

function ChartTip({ active, payload, label }: any) {
    if (!active||!payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl border border-slate-700">
            <p className="font-bold mb-1 text-slate-300">{label}</p>
            {payload.map((p:any)=>(
                <p key={p.name} style={{color:p.color??ORANGE}}>{p.name}: <span className="font-bold text-white">{typeof p.value==='number'&&p.value>999?fmtShort(p.value):p.value}</span></p>
            ))}
        </div>
    );
}

function Panel({ title, sub, children, badge, className='' }: { title:string; sub?:string; children:React.ReactNode; badge?:React.ReactNode; className?:string }) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:'0.04em'}} className="font-black text-slate-900">{title}</h2>
                    {sub&&<p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
                </div>
                {badge}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function MetricCard({ label, value, sub, trend, trendValue, icon, accent=ORANGE }: { label:string; value:string|number; sub?:string; trend?:'up'|'down'|'neutral'; trendValue?:string; icon:React.ReactNode; accent?:string }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{background:accent}}/>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                    <p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,letterSpacing:'0.02em'}} className="font-black text-slate-900 leading-none">{value}</p>
                    {sub&&<p className="text-xs text-slate-400 mt-1">{sub}</p>}
                </div>
                <div className="rounded-xl p-2.5" style={{background:`${accent}18`}}><span style={{color:accent}}>{icon}</span></div>
            </div>
            {trend&&trendValue&&(
                <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${trend==='up'?'text-emerald-600':trend==='down'?'text-red-500':'text-slate-400'}`}>
                    {trend==='up'?<ArrowUpRight size={13}/>:trend==='down'?<ArrowDownRight size={13}/>:null}{trendValue}
                </div>
            )}
        </div>
    );
}

// ─── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: DashboardData }) {
    const { gateEntries, shippingLines, drivers, transportCompanies } = data;
    const today = new Date();
    const todayEntries = filterByRange(gateEntries, startOf(today,'day'), endOf(today,'day'));
    const monthEntries = filterByRange(gateEntries, startOf(today,'month'), endOf(today,'month'));
    const activeInYard = gateEntries.filter(e=>!e.gate_out);
    const monthRevenue = monthEntries.reduce((s,e)=>s+(e.gate_in_payment_amount??0)+(e.payment_amount??0),0);

    const weeklyData = Array.from({length:7},(_,i)=>{
        const d=new Date(today); d.setDate(d.getDate()-(6-i));
        const es=filterByRange(gateEntries,startOf(d,'day'),endOf(d,'day'));
        return { day:d.toLocaleDateString('en-PH',{weekday:'short'}), gateIn:es.length, gateOut:es.filter(e=>e.gate_out).length };
    });

    const shippingData = shippingLines.map((sl,i)=>({
        name:sl.name, value:monthEntries.filter(e=>e.shipping_line===sl.name).length,
        color:[ORANGE,'#ea580c','#fb923c','#fdba74','#1e293b','#94a3b8'][i%6],
    })).filter(s=>s.value>0).sort((a,b)=>b.value-a.value).slice(0,6);

    const companyData = transportCompanies.map(c=>({ name:c.name, entries:monthEntries.filter(e=>e.transport_company===c.name).length })).sort((a,b)=>b.entries-a.entries);
    const companyTotal = companyData.reduce((s,c)=>s+c.entries,0);

    const trendData = Array.from({length:6},(_,i)=>{
        const d=new Date(today); d.setMonth(d.getMonth()-(5-i));
        const es=filterByRange(gateEntries,startOf(d,'month'),endOf(d,'month'));
        return { month:d.toLocaleDateString('en-PH',{month:'short'}), entries:es.length, revenue:es.reduce((s,e)=>s+(e.gate_in_payment_amount??0)+(e.payment_amount??0),0) };
    });

    const activeDrivers  = drivers.filter(d=>d.status==='active'&&d.lifeState==='active').length;
    const bannedDrivers  = drivers.filter(d=>d.status==='banned').length;
    const deceasedDrivers= drivers.filter(d=>d.lifeState==='deceased').length;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Gate Entries Today" value={todayEntries.length} sub="As of last sync" trend="up" trendValue="Live count" icon={<DoorOpen size={22}/>} accent={ORANGE}/>
                <MetricCard label="Active in Yard" value={activeInYard.length} sub="TEUs not yet gate-out" icon={<Container size={22}/>} accent="#0ea5e9"/>
                <MetricCard label="Total Drivers" value={drivers.length} sub={`${bannedDrivers} banned · ${deceasedDrivers} deceased`} icon={<Users size={22}/>} accent="#8b5cf6"/>
                <MetricCard label="Monthly Revenue" value={fmtShort(monthRevenue)} sub="Gate-in + Gate-out paid" trend="up" trendValue="Current month" icon={<CircleDollarSign size={22}/>} accent="#10b981"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Panel title="WEEKLY GATE TRAFFIC" sub="Last 7 days" className="md:col-span-2"
                    badge={<div className="flex gap-3 text-xs">{([['Gate In',ORANGE],['Gate Out','#1e293b']] as [string,string][]).map(([l,c])=><span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:c}}/>{l}</span>)}</div>}>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weeklyData} barCategoryGap="30%" barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                            <XAxis dataKey="day" tick={{fontFamily:'Outfit',fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                            <YAxis tick={{fontFamily:'Outfit',fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                            <Tooltip content={<ChartTip/>}/>
                            <Bar dataKey="gateIn"  name="Gate In"  fill={ORANGE}  radius={[4,4,0,0]}/>
                            <Bar dataKey="gateOut" name="Gate Out" fill="#1e293b" radius={[4,4,0,0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </Panel>
                <Panel title="SHIPPING LINES" sub="This month by volume">
                    {shippingData.length>0?(
                        <>
                            <ResponsiveContainer width="100%" height={130}>
                                <PieChart><Pie data={shippingData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3}>
                                    {shippingData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                                </Pie><Tooltip contentStyle={{borderRadius:8,fontFamily:'Outfit',fontSize:12,background:DARK,border:'none',color:'#fff'}}/></PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-1.5 mt-1">{shippingData.map(l=>(
                                <div key={l.name} className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{background:l.color}}/><span className="font-semibold text-slate-700">{l.name}</span></span>
                                    <span className="font-bold text-slate-900">{l.value}</span>
                                </div>
                            ))}</div>
                        </>
                    ):<p className="text-xs text-slate-400 text-center py-8">No entries this month</p>}
                </Panel>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Panel title="6-MONTH REVENUE TREND" sub="Combined gate-in + gate-out payments" className="md:col-span-2">
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={trendData}>
                            <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ORANGE} stopOpacity={0.25}/><stop offset="95%" stopColor={ORANGE} stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                            <XAxis dataKey="month" tick={{fontFamily:'Outfit',fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                            <YAxis tickFormatter={v=>fmtShort(v)} tick={{fontFamily:'Outfit',fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                            <Tooltip content={<ChartTip/>}/>
                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke={ORANGE} strokeWidth={2.5} fill="url(#revGrad)" dot={{fill:ORANGE,r:4}}/>
                        </AreaChart>
                    </ResponsiveContainer>
                </Panel>
                <Panel title="TRANSPORT COMPANIES" sub="Monthly share">
                    {companyData.length>0?(
                        <div className="space-y-4">{companyData.slice(0,5).map((c,i)=>{
                            const pct=companyTotal?Math.round((c.entries/companyTotal)*100):0;
                            return (
                                <div key={c.name}>
                                    <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-700 truncate pr-2">{c.name}</span><span className="font-black text-slate-900 flex-shrink-0">{pct}%</span></div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${pct}%`,background:[ORANGE,'#ea580c','#fb923c','#fdba74','#cbd5e1'][i]??'#cbd5e1'}}/></div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{c.entries} entries</p>
                                </div>
                            );
                        })}</div>
                    ):<p className="text-xs text-slate-400 text-center py-8">No data this month</p>}
                </Panel>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Panel title="DRIVERS" sub={`${activeDrivers} active · ${bannedDrivers} banned · ${deceasedDrivers} deceased`}
                    badge={<span className="text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-md">{drivers.length} total</span>}>
                    <div className="space-y-2">{drivers.slice(0,6).map((d,i)=>{
                        const bg=d.status==='banned'?'#fef2f2':d.lifeState==='deceased'?'#f8fafc':'#fff7ed';
                        const fg=d.status==='banned'?'#dc2626':d.lifeState==='deceased'?'#94a3b8':ORANGE;
                        const ini=d.name.split(' ').map((w:string)=>w[0]).join('').slice(0,2).toUpperCase();
                        return (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{background:bg,color:fg}}>{ini}</div>
                                <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-slate-800 truncate">{d.name}</p><p className="text-[10px] text-slate-400">{d.licenseNumber}</p></div>
                                <StatusPill status={d.status==='banned'?'banned':d.lifeState==='deceased'?'deceased':'active'}/>
                            </div>
                        );
                    })}
                    {drivers.length>6&&<p className="text-xs text-slate-400 text-center pt-1">+{drivers.length-6} more drivers</p>}
                    </div>
                </Panel>
                <Panel title="SHIPPING LINES" sub="All registered carriers"
                    badge={<span className="text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-md">{shippingLines.length} lines</span>}>
                    <div className="space-y-2">{shippingLines.slice(0,6).map((s,i)=>(
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{background:DARK,color:ORANGE}}>{s.code}</div>
                            <div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-800 truncate">{s.name}</p><p className="text-[10px] text-slate-400 truncate">{s.email??'No email'}</p></div>
                            <StatusPill status={s.life_state}/>
                        </div>
                    ))}
                    {shippingLines.length>6&&<p className="text-xs text-slate-400 text-center pt-1">+{shippingLines.length-6} more lines</p>}
                    </div>
                </Panel>
            </div>
        </div>
    );
}

// ─── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab({ gateEntries }: { gateEntries: GateEntry[] }) {
    const [period, setPeriod] = useState<ReportPeriod>('daily');
    const [cursor, setCursor] = useState(0);
    const today = new Date();

    const { label, rangeStart, rangeEnd, chartData, prevLabel } = useMemo(()=>{
        const ref=new Date(today);
        if (period==='daily') {
            ref.setDate(ref.getDate()+cursor);
            const rs=startOf(ref,'day'), re=endOf(ref,'day');
            const hours=Array.from({length:18},(_,i)=>{
                const h=i+5;
                const bucket=gateEntries.filter(e=>{const d=new Date(e.gate_in);return d>=rs&&d<=re&&d.getHours()===h;});
                return { label:`${h.toString().padStart(2,'0')}:00`, entries:bucket.length, gateInPaid:bucket.reduce((s,e)=>s+(e.gate_in_payment_amount??0),0), gateOutPaid:bucket.reduce((s,e)=>s+(e.payment_amount??0),0) };
            });
            const prev=new Date(ref); prev.setDate(prev.getDate()-1);
            return { label:ref.toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'}), rangeStart:rs, rangeEnd:re, chartData:hours, prevLabel:prev.toLocaleDateString('en-PH',{month:'short',day:'numeric'}) };
        }
        if (period==='weekly') {
            ref.setDate(ref.getDate()+cursor*7);
            const rs=startOf(ref,'week'), re=endOf(ref,'week');
            const days=Array.from({length:7},(_,i)=>{
                const d=new Date(rs); d.setDate(rs.getDate()+i);
                const bucket=filterByRange(gateEntries,startOf(d,'day'),endOf(d,'day'));
                return { label:d.toLocaleDateString('en-PH',{weekday:'short',month:'short',day:'numeric'}), entries:bucket.length, gateInPaid:bucket.reduce((s,e)=>s+(e.gate_in_payment_amount??0),0), gateOutPaid:bucket.reduce((s,e)=>s+(e.payment_amount??0),0) };
            });
            return { label:`Week of ${rs.toLocaleDateString('en-PH',{month:'short',day:'numeric'})} – ${re.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}`, rangeStart:rs, rangeEnd:re, chartData:days, prevLabel:'Previous week' };
        }
        ref.setMonth(ref.getMonth()+cursor);
        const rs=startOf(ref,'month'), re=endOf(ref,'month');
        const weeks=[1,2,3,4,5].map(w=>{
            const wStart=new Date(rs); wStart.setDate((w-1)*7+1);
            const wEnd=new Date(rs); wEnd.setDate(Math.min(w*7,re.getDate())); wEnd.setHours(23,59,59,999);
            if (wStart>re) return null;
            const bucket=filterByRange(gateEntries,wStart,wEnd);
            return { label:`Week ${w}`, entries:bucket.length, gateInPaid:bucket.reduce((s,e)=>s+(e.gate_in_payment_amount??0),0), gateOutPaid:bucket.reduce((s,e)=>s+(e.payment_amount??0),0) };
        }).filter(Boolean) as {label:string;entries:number;gateInPaid:number;gateOutPaid:number}[];
        const prev=new Date(ref); prev.setMonth(prev.getMonth()-1);
        return { label:ref.toLocaleDateString('en-PH',{month:'long',year:'numeric'}), rangeStart:rs, rangeEnd:re, chartData:weeks, prevLabel:prev.toLocaleDateString('en-PH',{month:'long',year:'numeric'}) };
    },[period,cursor,gateEntries]);

    const rangeEntries = useMemo(()=>filterByRange(gateEntries,rangeStart,rangeEnd),[gateEntries,rangeStart,rangeEnd]);
    const kpi = useMemo(()=>computePaymentSummary(rangeEntries),[rangeEntries]);
    const methodBreakdown = PAYMENT_METHODS.map(m=>({
        name:m,
        gateIn:rangeEntries.filter(e=>e.gate_in_payment_method===m).reduce((s,e)=>s+(e.gate_in_payment_amount??0),0),
        gateOut:rangeEntries.filter(e=>e.payment_method===m).reduce((s,e)=>s+(e.payment_amount??0),0),
    })).filter(m=>m.gateIn+m.gateOut>0);

    const handleExportExcel = () => {
        const rows=rangeEntries.map(e=>({'Container No':e.container_no,'Shipping Line':e.shipping_line,'Transport Co.':e.transport_company,'Driver':e.drivers_name,'Move Type':e.move_type,'Gate In':new Date(e.gate_in).toLocaleString('en-PH'),'Gate Out':e.gate_out?new Date(e.gate_out).toLocaleString('en-PH'):'','GI Status':e.gate_in_payment_status,'GI Amount':e.gate_in_payment_amount??0,'GI Method':e.gate_in_payment_method??'','GI Reference':e.gate_in_payment_reference??'','GO Status':e.payment_status,'GO Amount':e.payment_amount??0,'GO Method':e.payment_method??'','GO Reference':e.payment_reference??'','Total Collected':(e.gate_in_payment_amount??0)+(e.payment_amount??0)}));
        const summary=[{Metric:'Report Period',Value:label},{Metric:'Total Entries',Value:rangeEntries.length},{Metric:'Gate-In Collected',Value:kpi.totalGateIn},{Metric:'Gate-Out Collected',Value:kpi.totalGateOut},{Metric:'Total Revenue',Value:kpi.totalRevenue},{Metric:'Unpaid Gate-In',Value:kpi.totalUnpaidGateIn},{Metric:'Unpaid Gate-Out',Value:kpi.totalUnpaidGateOut},{Metric:'Collection Rate',Value:`${kpi.collectionRate}%`}];
        const wb=XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(summary),'Summary');
        XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'Transactions');
        XLSX.writeFile(wb,`Payment_Report_${period}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportCSV = () => {
        const headers=['Container No','Shipping Line','Transport Co.','Driver','Move Type','Gate In','Gate Out','GI Status','GI Amount','GI Method','GO Status','GO Amount','GO Method','Total'];
        const rows=rangeEntries.map(e=>[e.container_no,e.shipping_line,e.transport_company,e.drivers_name,e.move_type,new Date(e.gate_in).toLocaleString('en-PH'),e.gate_out?new Date(e.gate_out).toLocaleString('en-PH'):'',e.gate_in_payment_status,e.gate_in_payment_amount??0,e.gate_in_payment_method??'',e.payment_status,e.payment_amount??0,e.payment_method??'',(e.gate_in_payment_amount??0)+(e.payment_amount??0)].map(v=>{const s=String(v);return s.includes(',')?`"${s.replace(/"/g,'""')}"`  :s;}).join(','));
        const blob=new Blob([[headers.join(','),...rows].join('\n')],{type:'text/csv'});
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a'); a.href=url; a.download=`Payment_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        const win=window.open('','_blank'); if(!win) return;
        win.document.write(`<!DOCTYPE html><html><head><title>Payment Report — ${label}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:28px;color:#0f172a;font-size:12px}.header{border-bottom:3px solid #f97316;padding-bottom:10px;margin-bottom:18px}.header h1{font-size:22px;font-weight:900}.sub{font-size:11px;color:#64748b;margin-top:3px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}.kpi{border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;border-top:3px solid #f97316}.kpi .lbl{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#64748b;margin-bottom:4px}.kpi .val{font-size:18px;font-weight:900}.kpi.warn .val{color:#d97706}.sec{font-size:12px;font-weight:700;border-left:3px solid #f97316;padding-left:8px;margin:18px 0 8px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#0f172a;color:white;padding:7px 8px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.05em}td{padding:5px 8px;border-bottom:1px solid #f1f5f9}tr:nth-child(even) td{background:#f8fafc}.paid{color:#16a34a;font-weight:700;text-transform:uppercase}.unpaid{color:#d97706;font-weight:700;text-transform:uppercase}.tot{font-weight:900;color:#f97316}.footer{margin-top:24px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px}</style></head><body>
        <div class="header"><h1>Payment Report — ${period.charAt(0).toUpperCase()+period.slice(1)}</h1><div class="sub">${label} &nbsp;·&nbsp; Generated ${new Date().toLocaleString('en-PH')} &nbsp;·&nbsp; ${rangeEntries.length} entries</div></div>
        <div class="kpis"><div class="kpi"><div class="lbl">Gate-In Collected</div><div class="val">${fmt(kpi.totalGateIn)}</div></div><div class="kpi"><div class="lbl">Gate-Out Collected</div><div class="val">${fmt(kpi.totalGateOut)}</div></div><div class="kpi"><div class="lbl">Total Revenue</div><div class="val">${fmt(kpi.totalRevenue)}</div></div><div class="kpi"><div class="lbl">Collection Rate</div><div class="val">${kpi.collectionRate}%</div></div><div class="kpi warn"><div class="lbl">Unpaid Gate-In</div><div class="val">${fmt(kpi.totalUnpaidGateIn)}</div></div><div class="kpi warn"><div class="lbl">Unpaid Gate-Out</div><div class="val">${fmt(kpi.totalUnpaidGateOut)}</div></div><div class="kpi"><div class="lbl">Paid GI Count</div><div class="val">${kpi.paidGICount}</div></div><div class="kpi warn"><div class="lbl">Unpaid GI Count</div><div class="val">${kpi.unpaidGICount}</div></div></div>
        <div class="sec">Transactions (${rangeEntries.length} entries)</div>
        <table><thead><tr><th>#</th><th>Container</th><th>Shipping Line</th><th>Company</th><th>Gate In</th><th>GI Status</th><th>GI Amount</th><th>GO Status</th><th>GO Amount</th><th>Total</th></tr></thead><tbody>
        ${rangeEntries.map((e,i)=>`<tr><td>${i+1}</td><td><strong>${e.container_no}</strong></td><td>${e.shipping_line}</td><td>${e.transport_company}</td><td>${new Date(e.gate_in).toLocaleDateString('en-PH')}</td><td class="${e.gate_in_payment_status}">${e.gate_in_payment_status}</td><td>${e.gate_in_payment_amount?fmt(e.gate_in_payment_amount):'—'}</td><td class="${e.payment_status}">${e.payment_status}</td><td>${e.payment_amount?fmt(e.payment_amount):'—'}</td><td class="tot">${fmt((e.gate_in_payment_amount??0)+(e.payment_amount??0))}</td></tr>`).join('')}
        </tbody></table><div class="footer">© ${new Date().getFullYear()} Yard Operations System &nbsp;·&nbsp; Confidential</div></body></html>`);
        win.document.close(); setTimeout(()=>{win.focus();win.print();win.close();},300);
    };

    const periodTabs=[{key:'daily' as ReportPeriod,label:'Daily',icon:<Calendar size={15}/>},{key:'weekly' as ReportPeriod,label:'Weekly',icon:<CalendarDays size={15}/>},{key:'monthly' as ReportPeriod,label:'Monthly',icon:<CalendarRange size={15}/>}];

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">{periodTabs.map(p=>(
                    <button key={p.key} onClick={()=>{setPeriod(p.key);setCursor(0);}} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${period===p.key?'text-white shadow-md':'text-slate-600 bg-slate-100 hover:bg-slate-200'}`} style={period===p.key?{background:ORANGE}:{}}>{p.icon}{p.label}</button>
                ))}</div>
                <div className="flex items-center gap-2">
                    <button onClick={()=>setCursor(c=>c-1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"><ChevronLeft size={16} className="text-slate-600"/></button>
                    <div className="text-sm font-bold text-slate-800 min-w-[240px] text-center px-2">{label}</div>
                    <button onClick={()=>setCursor(c=>c+1)} disabled={cursor>=0} className={`w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center transition-colors ${cursor<0?'hover:bg-slate-50':'opacity-30 cursor-not-allowed'}`}><ChevronRight size={16} className="text-slate-600"/></button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"><FileSpreadsheet size={14}/>Excel</button>
                    <button onClick={handleExportCSV}   className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600    text-white hover:bg-blue-700    transition-colors shadow-sm"><Download size={14}/>CSV</button>
                    <button onClick={handlePrint}        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800   text-white hover:bg-slate-900   transition-colors shadow-sm"><Printer size={14}/>Print</button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Gate-In Collected"  value={fmtShort(kpi.totalGateIn)}  sub={`${kpi.paidGICount} paid`}  icon={<Banknote size={22}/>} accent={ORANGE}/>
                <MetricCard label="Gate-Out Collected" value={fmtShort(kpi.totalGateOut)} sub={`${kpi.paidGOCount} paid`}  icon={<WalletCards size={22}/>} accent="#0ea5e9"/>
                <MetricCard label="Total Revenue"      value={fmtShort(kpi.totalRevenue)} sub={`${kpi.collectionRate}% collection`} trend="up" trendValue={`vs ${prevLabel}`} icon={<CircleDollarSign size={22}/>} accent="#10b981"/>
                <MetricCard label="Total Unpaid"       value={fmtShort(kpi.totalUnpaidGateIn+kpi.totalUnpaidGateOut)} sub={`${kpi.unpaidGICount+kpi.unpaidGOCount} pending`} icon={<AlertCircle size={22}/>} accent="#f59e0b"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4">
                    {[{title:'Gate-In Payments',accent:ORANGE,icon:<DoorOpen size={13} color={ORANGE}/>,paid:kpi.paidGICount,unpaid:kpi.unpaidGICount,paidAmt:kpi.totalGateIn,unpaidAmt:kpi.totalUnpaidGateIn,barColor:'bg-emerald-500'},{title:'Gate-Out Payments',accent:'#0ea5e9',icon:<TrendingUp size={13} className="text-sky-500"/>,paid:kpi.paidGOCount,unpaid:kpi.unpaidGOCount,paidAmt:kpi.totalGateOut,unpaidAmt:kpi.totalUnpaidGateOut,barColor:'bg-sky-500'}].map(s=>(
                        <div key={s.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{background:s.accent}}/>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">{s.icon}{s.title}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-50 rounded-xl p-3"><div className="flex items-center gap-1.5 mb-1"><CheckCircle2 size={13} className="text-emerald-600"/><span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Paid</span></div><p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22}} className="font-black text-emerald-800">{s.paid}</p><p className="text-xs text-emerald-600 font-semibold">{fmtShort(s.paidAmt)}</p></div>
                                <div className="bg-amber-50 rounded-xl p-3"><div className="flex items-center gap-1.5 mb-1"><AlertCircle size={13} className="text-amber-600"/><span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Unpaid</span></div><p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22}} className="font-black text-amber-800">{s.unpaid}</p><p className="text-xs text-amber-600 font-semibold">{fmtShort(s.unpaidAmt)}</p></div>
                            </div>
                            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${s.barColor}`} style={{width:`${s.paid+s.unpaid>0?Math.round((s.paid/(s.paid+s.unpaid))*100):0}%`}}/></div>
                            <p className="text-[10px] text-slate-400 mt-1">{s.paid+s.unpaid>0?Math.round((s.paid/(s.paid+s.unpaid))*100):0}% collected</p>
                        </div>
                    ))}
                </div>
                <Panel title={`${period==='daily'?'HOURLY':period==='weekly'?'DAILY':'WEEKLY'} REVENUE`} sub="Gate-in vs Gate-out collected" className="md:col-span-2"
                    badge={<div className="flex gap-3 text-xs">{([['Gate-In',ORANGE],['Gate-Out','#0ea5e9']] as [string,string][]).map(([l,c])=><span key={l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{background:c}}/>{l}</span>)}</div>}>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData} barCategoryGap="25%" barGap={3}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                            <XAxis dataKey="label" tick={{fontFamily:'Outfit',fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} interval={period==='daily'?2:0}/>
                            <YAxis tickFormatter={v=>fmtShort(v)} tick={{fontFamily:'Outfit',fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                            <Tooltip content={<ChartTip/>}/>
                            <Bar dataKey="gateInPaid"  name="Gate-In"  fill={ORANGE}  radius={[3,3,0,0]}/>
                            <Bar dataKey="gateOutPaid" name="Gate-Out" fill="#0ea5e9" radius={[3,3,0,0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </Panel>
            </div>

            {methodBreakdown.length>0&&(
                <Panel title="PAYMENT METHOD BREAKDOWN" sub="How payments were collected this period">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{methodBreakdown.map(m=>(
                        <div key={m.name} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{m.name}</p>
                            <p className="text-sm font-black text-slate-900">{fmtShort(m.gateIn+m.gateOut)}</p>
                            <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-[10px]"><span className="text-slate-400">Gate-In</span><span className="font-semibold" style={{color:ORANGE}}>{fmtShort(m.gateIn)}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-slate-400">Gate-Out</span><span className="font-semibold text-sky-600">{fmtShort(m.gateOut)}</span></div>
                            </div>
                        </div>
                    ))}</div>
                </Panel>
            )}

            <Panel title="TRANSACTIONS" sub={`${rangeEntries.length} entries in this period`} badge={<span className="text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-md uppercase tracking-wider">{rangeEntries.length} total</span>}>
                {rangeEntries.length===0?(
                    <p className="text-xs text-slate-400 text-center py-10">No entries found for this period.</p>
                ):(
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="min-w-full text-xs">
                            <thead><tr style={{background:DARK}}>{['Container','Company','Driver','Gate In','GI Status','GI Amount','GO Status','GO Amount','Total'].map(h=><th key={h} className="py-3 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-300 whitespace-nowrap">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-slate-50">
                                {rangeEntries.slice(0,100).map((r,i)=>(
                                    <tr key={i} className="hover:bg-orange-50 transition-colors">
                                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">{r.container_no}</td>
                                        <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{r.transport_company}</td>
                                        <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{r.drivers_name}</td>
                                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{new Date(r.gate_in).toLocaleString('en-PH')}</td>
                                        <td className="py-2.5 px-4"><StatusPill status={r.gate_in_payment_status}/></td>
                                        <td className="py-2.5 px-4 font-semibold text-slate-800 whitespace-nowrap">{r.gate_in_payment_amount?fmt(r.gate_in_payment_amount):'—'}</td>
                                        <td className="py-2.5 px-4"><StatusPill status={r.payment_status}/></td>
                                        <td className="py-2.5 px-4 font-semibold text-slate-800 whitespace-nowrap">{r.payment_amount?fmt(r.payment_amount):'—'}</td>
                                        <td className="py-2.5 px-4 font-black whitespace-nowrap" style={{color:ORANGE}}>{fmt((r.gate_in_payment_amount??0)+(r.payment_amount??0))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {rangeEntries.length>100&&<p className="text-xs text-slate-400 text-center py-3 border-t border-slate-100">Showing 100 of {rangeEntries.length} — use Export to see all</p>}
                    </div>
                )}
            </Panel>
        </div>
    );
}

// ─── Root ───────────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const [tab,setTab]       = useState<TabKey>('overview');
    const [clock,setClock]   = useState('');
    const [data,setData]     = useState<DashboardData|null>(null);
    const [loading,setLoading] = useState(true);
    const [error,setError]   = useState<string|null>(null);

    useEffect(()=>{
        const tick=()=>setClock(new Date().toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));
        tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
    },[]);

    useEffect(()=>{
        let cancelled=false;
        setLoading(true); setError(null);
        fetchDashboardData()
            .then(result=>{if(!cancelled){setData(result);setLoading(false);}})
            .catch(err=>{if(!cancelled){setError(err?.message??'Failed to load data');setLoading(false);}});
        return ()=>{cancelled=true;};
    },[]);

    const footerStats = data?[
        {icon:<CreditCard size={14}/>, val:`${data.gateEntries.length>0?Math.round((data.gateEntries.filter(e=>e.gate_in_payment_status==='paid').length/data.gateEntries.length)*100):0}%`, lbl:'Payment Rate'},
        {icon:<Clock size={14}/>,      val:data.gateEntries.length>0?(data.gateEntries.reduce((s,e)=>s+(e.days_in_yard??0),0)/data.gateEntries.length).toFixed(1):'0', lbl:'Avg Days in Yard'},
        {icon:<Activity size={14}/>,   val:`${data.transportCompanies.filter(c=>c.status==='active').length}`, lbl:'Active Companies'},
        {icon:<Container size={14}/>,  val:`${data.gateEntries.filter(e=>!e.gate_out).length}`, lbl:'TEUs in Yard'},
        {icon:<Ship size={14}/>,       val:`${data.shippingLines.filter(s=>s.life_state==='Active').length}`, lbl:'Active Lines'},
        {icon:<Truck size={14}/>,      val:`${data.drivers.filter(d=>d.status==='active').length}`, lbl:'Active Drivers'},
    ]:[];

    const tabs=[{key:'overview' as TabKey,label:'Overview',icon:<LayoutDashboard size={16}/>},{key:'reports' as TabKey,label:'Payment Reports',icon:<FileBarChart2 size={16}/>}];

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');`}</style>
            <div className="flex-1 bg-slate-100 min-h-screen" style={{fontFamily:"'Outfit',sans-serif"}}>
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 pt-4 pb-0 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl p-2" style={{background:`${ORANGE}25`}}><LayoutDashboard size={22} color={ORANGE}/></div>
                            <div>
                                <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,letterSpacing:'0.06em'}} className="text-white font-black">YARD OPERATIONS DASHBOARD</h1>
                                <p className="text-slate-400 text-xs">Container Terminal Management System</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold" style={{background:'rgba(249,115,22,0.15)',color:ORANGE,border:'1px solid rgba(249,115,22,0.3)'}}>
                                <span className="w-2 h-2 rounded-full animate-pulse" style={{background:ORANGE}}/>{loading?'LOADING…':error?'ERROR':'LIVE'}
                            </div>
                            <div className="text-right">
                                <p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:'0.06em'}} className="text-white font-black">{clock}</p>
                                <p className="text-slate-500 text-[10px] uppercase tracking-widest">Local Time</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1">{tabs.map(t=>(
                        <button key={t.key} onClick={()=>setTab(t.key)} className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all ${tab===t.key?'bg-slate-100 text-slate-900':'text-slate-400 hover:text-slate-200'}`}>
                            <span style={{color:tab===t.key?ORANGE:'inherit'}}>{t.icon}</span>{t.label}
                            {t.key==='reports'&&tab!=='reports'&&<span className="ml-1 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{background:ORANGE}}>NEW</span>}
                        </button>
                    ))}</div>
                </div>

                <div className="p-6">
                    {loading&&<DashboardSkeleton/>}
                    {!loading&&error&&(
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                            <AlertCircle size={32} className="text-red-400 mx-auto mb-3"/>
                            <p className="text-red-700 font-bold text-sm">{error}</p>
                            <p className="text-red-400 text-xs mt-1">Check your API connection and try refreshing.</p>
                        </div>
                    )}
                    {!loading&&!error&&data&&(tab==='overview'?<OverviewTab data={data}/>:<ReportsTab gateEntries={data.gateEntries}/>)}
                </div>

                {!loading&&!error&&data&&(
                    <div className="mx-6 mb-6 rounded-2xl overflow-hidden shadow-lg">
                        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 grid grid-cols-3 md:grid-cols-6 gap-4">
                            {footerStats.map((s,i)=>(
                                <div key={i} className="text-center">
                                    <div className="flex items-center justify-center mb-1" style={{color:ORANGE}}>{s.icon}</div>
                                    <p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:'0.04em'}} className="font-black text-white">{s.val}</p>
                                    <p className="text-slate-500 uppercase tracking-widest" style={{fontSize:9}}>{s.lbl}</p>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-2 flex items-center justify-between" style={{background:ORANGE}}>
                            <p className="text-white text-xs font-bold uppercase tracking-widest">Yard Operations Dashboard</p>
                            <p className="text-orange-100 text-xs">{new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}