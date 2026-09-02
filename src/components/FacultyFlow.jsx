import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard, History as HistoryIcon, Settings as SettingsIcon,
  Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsUpDown,
  Upload, RefreshCw, CheckCircle2, Clock, XCircle, AlertTriangle,
  Sun, Moon, Monitor, Download, X, Menu, ArrowUpDown, Calendar as CalendarIcon,
  TrendingUp, Users, FileSpreadsheet, Bell, ChevronRight as ChevronRightIcon,
  FolderSync, PlugZap, Coffee, PauseCircle, SlidersHorizontal, Columns3,
  ArrowRight, Building2, BookOpen, Timer, PieChart as PieChartIcon
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, PieChart, Pie
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

/* ============================================================================
   FACULTY FLOW — Teacher Roll Call Management System
   Built for SRMVDP. This is a fully interactive front-end demo running on
   generated sample data (no live biometric machine or file system in this
   preview) so every screen, chart and interaction can be explored end to end.
============================================================================ */

/* ---------------------------------- THEME --------------------------------- */

const PALETTE = {
  light: {
    canvas: "#F6F7F5",
    surface: "#FFFFFF",
    surfaceAlt: "#F1F3EF",
    border: "#E4E7E1",
    borderStrong: "#D3D8CD",
    ink: "#1B211C",
    inkMuted: "#5B6459",
    inkFaint: "#8B9285",
    brand: "#0E7C4A",
    brandDark: "#0A5E38",
    brandLight: "#E4F3E9",
    brandSoft: "#EEF7F1",
    ring: "rgba(14,124,74,0.35)",
  },
  dark: {
    canvas: "#12140F",
    surface: "#1A1D16",
    surfaceAlt: "#20241B",
    border: "#2B2F25",
    borderStrong: "#383E30",
    ink: "#EDF1E9",
    inkMuted: "#A6AE9C",
    inkFaint: "#767E6D",
    brand: "#3FCE86",
    brandDark: "#2CA968",
    brandLight: "#1B3226",
    brandSoft: "#182A20",
    ring: "rgba(63,206,134,0.35)",
  },
};

const STATUS_META = {
  Present: { fg: "#0E7C4A", bg: "#E4F3E9", dot: "#0E7C4A" },
  Late: { fg: "#B25A00", bg: "#FCEEDD", dot: "#DB8300" },
  Absent: { fg: "#B4232A", bg: "#FBE6E5", dot: "#D5333B" },
  Waiting: { fg: "#1D5DBF", bg: "#E4EEFC", dot: "#2E6FDB" },
  Leave: { fg: "#7A3FBF", bg: "#F0E6FC", dot: "#8A4FD0" },
  Holiday: { fg: "#5B6459", bg: "#EEF0EC", dot: "#8B9285" },
};

/* --------------------------------- SAMPLE DATA ------------------------------ */

const DEPARTMENTS = ["Computer Science", "Electronics (ECE)", "Mechanical", "Civil", "MBA", "Mathematics", "Physics", "English"];

const TEACHERS = [
  { id: "t1", name: "Dr. Chitra Ramesh", dept: "Computer Science", subject: "Data Structures" },
  { id: "t2", name: "Mr. Kumaresan Pillai", dept: "Electronics (ECE)", subject: "Digital Circuits" },
  { id: "t3", name: "Mrs. Priya Narayanan", dept: "MBA", subject: "Marketing Management" },
  { id: "t4", name: "Dr. Anand Krishnan", dept: "Mechanical", subject: "Thermodynamics" },
  { id: "t5", name: "Ms. Divya Suresh", dept: "Civil", subject: "Structural Analysis" },
  { id: "t6", name: "Mr. Vignesh Raja", dept: "Computer Science", subject: "Operating Systems" },
  { id: "t7", name: "Mrs. Meenakshi Iyer", dept: "Mathematics", subject: "Discrete Mathematics" },
  { id: "t8", name: "Dr. Bala Subramaniam", dept: "Physics", subject: "Applied Physics" },
  { id: "t9", name: "Mrs. Lakshmi Prasad", dept: "English", subject: "Technical Communication" },
  { id: "t10", name: "Mr. Arun Chezhian", dept: "Electronics (ECE)", subject: "Signals & Systems" },
  { id: "t11", name: "Dr. Deepa Venkatesan", dept: "Computer Science", subject: "Database Systems" },
  { id: "t12", name: "Mr. Sathish Kumar", dept: "Mechanical", subject: "Fluid Mechanics" },
  { id: "t13", name: "Ms. Nandhini Raja", dept: "Civil", subject: "Surveying" },
  { id: "t14", name: "Dr. Ravi Shankar", dept: "MBA", subject: "Business Analytics" },
];

const HOUR_1 = "08:00";
const HOUR_2 = "08:50";
const TIMETABLE = {
  t1: { Mon: "08:00", Tue: "08:50", Wed: "09:40", Thu: "08:00", Fri: "10:30" },
  t2: { Mon: "08:50", Tue: "09:40", Wed: "08:00", Thu: "09:40", Fri: "08:50" },
  t3: { Mon: "09:40", Tue: null, Wed: "08:50", Thu: "08:50", Fri: "10:30" },
  t4: { Mon: "10:30", Tue: "08:00", Wed: "08:50", Thu: null, Fri: "08:00" },
  t5: { Mon: "08:00", Tue: "08:00", Wed: "10:30", Thu: "08:50", Fri: null },
  t6: { Mon: "08:50", Tue: "08:50", Wed: "08:00", Thu: "09:40", Fri: "08:50" },
  t7: { Mon: "08:00", Tue: "09:40", Wed: "08:00", Thu: "08:00", Fri: "09:40" },
  t8: { Mon: null, Tue: "08:50", Wed: "08:50", Thu: "09:40", Fri: "08:00" },
  t9: { Mon: "10:30", Tue: "10:30", Wed: null, Thu: "09:40", Fri: "10:30" },
  t10: { Mon: "08:50", Tue: "08:00", Wed: "09:40", Thu: "08:50", Fri: "08:00" },
  t11: { Mon: "08:00", Tue: "08:00", Wed: "08:50", Thu: "08:00", Fri: null },
  t12: { Mon: "09:40", Tue: "08:50", Wed: "08:00", Thu: "08:50", Fri: "09:40" },
  t13: { Mon: "08:50", Tue: "09:40", Wed: "08:00", Thu: null, Fri: "08:50" },
  t14: { Mon: "08:00", Tue: "08:50", Wed: "09:40", Thu: "08:00", Fri: null },
};
const DEMO_DATE = new Date(2026, 7, 31);
const DEMO_WEEKDAY = "Mon";
const DEMO_NOW_MIN = 8 * 60 + 42;
const END_OF_DAY_MIN = 17 * 60;
function deadlineFor(classTime) {
  if (classTime == null) return null;
  if (classTime === HOUR_1) return 7 * 60 + 55;
  if (classTime === HOUR_2) return 8 * 60 + 40;
  return 9 * 60;
}


function toMin(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function minToLabel(min) {
  if (min == null) return "—";
  let h = Math.floor(min / 60), m = min % 60;
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}
function dateLabel(d) {
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// Deterministic pseudo-random generator so charts/history stay stable across renders.
function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const BASE_PUNCHES = {
  t1: "07:58", t2: "08:44", t4: "09:07", t5: "07:51",
  t7: "08:04", t10: "08:52", t11: "07:50", t12: "09:41", t14: "08:12",
};
const PENDING_PUNCHES = [
  { id: "t13", time: "08:47" },
  { id: "t6", time: "08:58" },
  { id: "t3", time: "09:12" },
];
function punchSheet(syncCount) {
  const sheet = { ...BASE_PUNCHES };
  PENDING_PUNCHES.slice(0, syncCount).forEach((p) => { sheet[p.id] = p.time; });
  return sheet;
}
function computeStatus({ deadline, punch, nowMin, leave }) {
  if (deadline == null) return "Holiday";
  if (leave) return "Leave";
  if (punch != null) return punch <= deadline ? "Present" : "Late";
  if (nowMin >= END_OF_DAY_MIN) return "Absent";
  return nowMin >= deadline ? "Absent" : "Waiting";
}
function buildTodayRecords(syncCount = 0, nowMin = DEMO_NOW_MIN, override = null) {
  const sheet = override || punchSheet(syncCount);
  return TEACHERS.filter((t) => TIMETABLE[t.id][DEMO_WEEKDAY] != null).map((t) => {
    const classTime = TIMETABLE[t.id][DEMO_WEEKDAY];
    const deadline = deadlineFor(classTime);
    const leave = !override && t.id === "t8";
    const punchRaw = sheet[t.id];
    const punch = leave ? null : (punchRaw ? toMin(punchRaw) : null);
    const status = computeStatus({ deadline, punch, nowMin: override ? END_OF_DAY_MIN : nowMin, leave });
    const delay = status === "Late" ? punch - deadline : status === "Present" ? Math.max(deadline - punch, 0) * -1 : null;
    return { id: t.id, name: t.name, dept: t.dept, subject: t.subject, firstClass: classTime, deadline, punch, status, delay };
  });
}
async function parsePunchFile(file) {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const map = {};
  rows.forEach((r) => {
    const vals = Object.entries(r);
    const nameEntry = vals.find(([k]) => /name|teacher|staff/i.test(k));
    const timeEntry = vals.find(([k]) => /time|punch|in/i.test(k));
    if (!nameEntry || !timeEntry) return;
    const name = String(nameEntry[1]).trim().toLowerCase();
    const time = String(timeEntry[1]).trim().slice(0, 5);
    if (!name || !/^\d{1,2}:\d{2}$/.test(time)) return;
    const t = TEACHERS.find((x) => x.name.toLowerCase() === name || x.name.toLowerCase().includes(name) || name.includes(x.name.toLowerCase()));
    if (t && TIMETABLE[t.id][DEMO_WEEKDAY] != null) map[t.id] = time.padStart(5, "0");
  });
  return map;
}
const HISTORY_KEY = "ff_history_store";
function loadHistoryStore() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "{}"); } catch { return {}; }
}
function saveHistoryDay(dateKey, records) {
  if (typeof window === "undefined" || !records.length) return;
  const store = loadHistoryStore();
  store[dateKey] = records.map((r) => ({ id: r.id, teacher: r.name, dept: r.dept, status: r.status, delay: r.delay, deadline: r.deadline, punch: r.punch }));
  try { window.localStorage.setItem(HISTORY_KEY, JSON.stringify(store)); } catch { /* quota */ }
}
function buildHistory(teacherId, days = 30) {
  const rand = seeded(teacherId.charCodeAt(0) * 97 + teacherId.length * 13 + days);
  const out = [];
  let d = new Date(DEMO_DATE);
  while (out.length < days) {
    d.setDate(d.getDate() - 1);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow];
    const classTime = TIMETABLE[teacherId][wd];
    if (classTime == null) { out.push({ date: new Date(d), status: "Holiday", delay: null, deadline: null, punch: null }); continue; }
    const deadline = deadlineFor(classTime);
    const r = rand();
    let status, delay, punch;
    if (r < 0.72) { status = "Present"; delay = -Math.round(rand() * 6); punch = deadline + delay; }
    else if (r < 0.88) { status = "Late"; delay = Math.round(3 + rand() * 22); punch = deadline + delay; }
    else if (r < 0.95) { status = "Absent"; delay = null; punch = null; }
    else { status = "Leave"; delay = null; punch = null; }
    out.push({ date: new Date(d), status, delay, deadline, punch });
  }
  return out.reverse();
}


/* Month-to-date stats for a single teacher (used by search + drawer). */
const MONTH_LABEL = DEMO_DATE.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

function monthStats(teacherId, todayRecord) {
  const rows = buildHistory(teacherId, 30).filter(
    (h) => h.date.getMonth() === DEMO_DATE.getMonth() && h.date.getFullYear() === DEMO_DATE.getFullYear()
  );
  if (todayRecord) rows.push({ date: DEMO_DATE, status: todayRecord.status, delay: todayRecord.delay });
  const working = rows.filter((r) => r.status !== "Holiday");
  const lateRows = rows.filter((r) => r.status === "Late");
  const present = rows.filter((r) => r.status === "Present").length;
  const absent = rows.filter((r) => r.status === "Absent").length;
  const leave = rows.filter((r) => r.status === "Leave").length;
  const totalLateMin = lateRows.reduce((a, b) => a + (b.delay || 0), 0);
  return {
    month: MONTH_LABEL,
    rows,
    lateRows,
    workingDays: working.length,
    late: lateRows.length,
    present,
    absent,
    leave,
    pct: working.length ? Math.round(((present + lateRows.length) / working.length) * 100) : 0,
    avgLate: lateRows.length ? Math.round(totalLateMin / lateRows.length) : 0,
    totalLateMin,
  };
}

/* ------------------------------- SMALL PRIMITIVES --------------------------- */

function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META.Holiday;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ color: m.fg, background: m.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.dot }} />
      {status}
    </span>
  );
}

function IconButton({ icon: Icon, onClick, label, c, active }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="inline-flex items-center justify-center h-9 w-9 rounded-xl transition-colors"
      style={{
        color: active ? c.brand : c.inkMuted,
        background: active ? c.brandSoft : "transparent",
        border: `1px solid ${active ? c.brand + "33" : "transparent"}`,
      }}
    >
      <Icon size={17} strokeWidth={2} />
    </button>
  );
}

/* ----------------------------------- APP ------------------------------------ */

export default function FacultyFlowApp() {
  const [themeMode, setThemeMode] = useState("light"); // light | dark | system
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const fn = (e) => setSystemDark(e.matches);
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);
  const resolvedDark = themeMode === "dark" || (themeMode === "system" && systemDark);
  const c = resolvedDark ? PALETTE.dark : PALETTE.light;

  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [lastSync, setLastSync] = useState(new Date(Date.now() - 60000));
  const [toasts, setToasts] = useState([]);
  const [drawerTeacher, setDrawerTeacher] = useState(null);
  const [syncCount, setSyncCount] = useState(0);
  const [watchConnected, setWatchConnected] = useState(true);
  const [sources, setSources] = useState({ timetable: "timetable-aug-2026.xlsx", punch: "punch-31-08-2026.xlsx" });

  const pushToast = useCallback((title, desc, kind = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, title, desc, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const syncNow = useCallback((manual) => {
    setSyncCount((n) => {
      const next = Math.min(n + 1, PENDING_PUNCHES.length);
      setLastSync(new Date());
      if (next > n) pushToast("New punch record imported", `${PENDING_PUNCHES[next - 1].id.toUpperCase()} punched at ${PENDING_PUNCHES[next - 1].time}.`, "sync");
      else if (manual) pushToast("Already up to date", "No new punch records found in the watched folder.", "info");
      return next;
    });
  }, [pushToast]);

  useEffect(() => {
    const iv = setInterval(() => { if (watchConnected) syncNow(false); }, 20000);
    return () => clearInterval(iv);
  }, [syncNow, watchConnected]);

  useEffect(() => {
    if (watchConnected) return;
    const t = setTimeout(() => { setWatchConnected(true); pushToast("Watch folder reconnected", "Connection restored automatically.", "success"); }, 4000);
    return () => clearTimeout(t);
  }, [watchConnected, pushToast]);

  const [cleared, setCleared] = useState(false);
  const [punchOverride, setPunchOverride] = useState(null);
  const todayRecords = useMemo(() => (cleared ? [] : buildTodayRecords(syncCount, DEMO_NOW_MIN, punchOverride)), [syncCount, cleared, punchOverride]);
  useEffect(() => { if (todayRecords.length) saveHistoryDay(DEMO_DATE.toDateString(), todayRecords); }, [todayRecords]);
  const clearPunchSheet = useCallback(() => {
    setCleared(true); setPunchOverride(null); setSyncCount(0);
    setSources((s) => ({ ...s, punch: "— no punch sheet —" }));
    pushToast("Punch sheet cleared", "Today's view is empty. Past days remain in History.", "info");
  }, [pushToast]);
  const applyPunchUpload = useCallback((map, fileName) => {
    setPunchOverride(map); setCleared(false); setSyncCount(0); setLastSync(new Date());
    setSources((s) => ({ ...s, punch: fileName }));
    pushToast("Punch sheet applied", `${Object.keys(map).length} punches matched against today's timetable.`, "success");
  }, [pushToast]);



  const summary = useMemo(() => {
    const scheduled = todayRecords.filter((r) => r.status !== "Holiday").length;
    const by = (s) => todayRecords.filter((r) => r.status === s).length;
    const present = by("Present"), late = by("Late"), absent = by("Absent"), waiting = by("Waiting"), leave = by("Leave");
    const pct = scheduled ? Math.round(((present + late) / scheduled) * 100) : 0;
    return { scheduled, present, late, absent, waiting, leave, pct };
  }, [todayRecords]);

  const shell = { background: c.canvas, color: c.ink, minHeight: "100vh", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" };

  return (
    <div style={shell} className="w-full transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Inter+Tight:wght@600;700;800&display=swap');
        * { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
        .ff-mono { font-variant-numeric: tabular-nums; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${c.borderStrong}; border-radius: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div className="flex">
        <Sidebar c={c} page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen}
          mobileOpen={mobileNavOpen} setMobileOpen={setMobileNavOpen} />

        <div className="flex-1 min-w-0">
          <TopHeader
            c={c} clock={clock} lastSync={lastSync} summary={summary} todayRecords={todayRecords}
            themeMode={themeMode} setThemeMode={setThemeMode}
            onMenu={() => setMobileNavOpen(true)}
            onManualNote={() => syncNow(true)}
          />

          <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
            <AnimatePresence mode="wait">
              {page === "dashboard" && (
                <motion.div key="dash" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                  <Dashboard c={c} records={todayRecords} summary={summary} onOpenTeacher={setDrawerTeacher}
                    pushToast={pushToast} syncNow={syncNow} lastSync={lastSync} watchConnected={watchConnected}
                    setWatchConnected={setWatchConnected} sources={sources} setSources={setSources}
                    clearPunchSheet={clearPunchSheet} applyPunchUpload={applyPunchUpload} />
                </motion.div>
              )}
              {page === "history" && (
                <motion.div key="hist" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                  <HistoryPage c={c} onOpenTeacher={setDrawerTeacher} pushToast={pushToast} />
                </motion.div>
              )}
              {page === "settings" && (
                <motion.div key="set" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                  <SettingsPage c={c} themeMode={themeMode} setThemeMode={setThemeMode} pushToast={pushToast} />
                </motion.div>
              )}

            </AnimatePresence>
          </main>
        </div>
      </div>

      <TeacherDrawer c={c} teacherId={drawerTeacher} onClose={() => setDrawerTeacher(null)} todayRecords={todayRecords} />
      <ToastStack c={c} toasts={toasts} />
    </div>
  );
}

/* --------------------------------- SIDEBAR ----------------------------------- */

function Sidebar({ c, page, setPage, open, setOpen, mobileOpen, setMobileOpen }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "history", label: "History", icon: HistoryIcon },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  const content = (
    <div className="h-full flex flex-col" style={{ background: c.surface, borderRight: `1px solid ${c.border}` }}>
      <div className="flex items-center gap-2.5 px-4 h-16 shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.brand }}>
          <BookOpen size={16} color="#fff" strokeWidth={2.4} />
        </div>
        {open && (
          <div className="min-w-0">
            <div className="text-[14px] font-bold leading-tight truncate" style={{ color: c.ink, fontFamily: "'Inter Tight', Inter, sans-serif" }}>Faculty Flow</div>
            <div className="text-[11px] leading-tight truncate" style={{ color: c.inkFaint }}>SRMVDP</div>
          </div>
        )}
        <button className="ml-auto hidden lg:inline-flex h-7 w-7 items-center justify-center rounded-md" style={{ color: c.inkFaint }}
          onClick={() => setOpen((o) => !o)}>
          <ChevronLeft size={15} className={open ? "" : "rotate-180"} style={{ transition: "transform .2s" }} />
        </button>
        <button className="ml-auto lg:hidden h-7 w-7 inline-flex items-center justify-center rounded-md" style={{ color: c.inkFaint }}
          onClick={() => setMobileOpen(false)}>
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 px-2.5 py-4 space-y-1">
        {items.map((it) => {
          const active = page === it.id;
          return (
            <button
              key={it.id}
              onClick={() => { setPage(it.id); setMobileOpen(false); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: active ? c.brandSoft : "transparent",
                color: active ? c.brand : c.inkMuted,
              }}
            >
              <it.icon size={17} strokeWidth={2.2} />
              {open && <span className="truncate">{it.label}</span>}
              {active && open && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: c.brand }} />}
            </button>
          );
        })}
      </nav>

      {open && (
        <div className="px-4 py-4 mx-2.5 mb-3 rounded-xl" style={{ background: c.brandSoft }}>
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: c.brandDark }}>
            <FolderSync size={14} /> Watch folder active
          </div>
          <p className="text-[11px] mt-1 leading-relaxed" style={{ color: c.inkMuted }}>
            Punch sheet is monitored continuously. New records import automatically.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className={`hidden lg:block shrink-0 sticky top-0 h-screen transition-all duration-200`} style={{ width: open ? 240 : 76 }}>
        {content}
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: "tween", duration: 0.2 }}
              className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden">
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* -------------------------------- TOP HEADER --------------------------------- */

function TopHeader({ c, clock, lastSync, summary, themeMode, setThemeMode, onMenu, onManualNote, todayRecords }) {
  const timeStr = clock.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const syncStr = lastSync.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <header className="sticky top-0 z-30 backdrop-blur" style={{ background: c.surface + "F2", borderBottom: `1px solid ${c.border}` }}>
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3 max-w-[1400px] mx-auto">
        <button className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg" style={{ color: c.inkMuted }} onClick={onMenu}>
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <div className="text-[15px] font-bold leading-tight" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>Today's Teacher Attendance</div>
          <div className="text-[12px] leading-tight" style={{ color: c.inkFaint }}>{dateLabel(DEMO_DATE)}</div>
        </div>

        <div className="hidden md:block ml-6 flex-1 max-w-sm">
          <TeacherSearch c={c} todayRecords={todayRecords} />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-4 pr-4 mr-1" style={{ borderRight: `1px solid ${c.border}` }}>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: c.inkFaint }}>Current time</div>
              <div className="text-[13px] font-semibold ff-mono" style={{ color: c.ink }}>{timeStr}</div>
            </div>
            <button onClick={onManualNote} className="text-right group" title="Faculty Flow syncs automatically">
              <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: c.inkFaint }}>Last sync</div>
              <div className="text-[13px] font-semibold ff-mono flex items-center gap-1" style={{ color: c.brand }}>
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: c.brand }} />
                {syncStr}
              </div>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 rounded-xl p-1" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}` }}>
            {[["light", Sun], ["system", Monitor], ["dark", Moon]].map(([mode, Icon]) => (
              <button key={mode} onClick={() => setThemeMode(mode)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-lg transition-colors"
                style={{ background: themeMode === mode ? c.surface : "transparent", color: themeMode === mode ? c.brand : c.inkFaint, boxShadow: themeMode === mode ? "0 1px 2px rgba(0,0,0,.08)" : "none" }}>
                <Icon size={14} />
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: c.brandSoft }}>
            <Users size={14} style={{ color: c.brand }} />
            <span className="text-[12px] font-semibold" style={{ color: c.brandDark }}>{summary.pct}% present</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* --------------------------------- DASHBOARD ---------------------------------- */

function Dashboard({ c, records, summary, onOpenTeacher, pushToast, syncNow, lastSync, watchConnected, setWatchConnected, sources, setSources, clearPunchSheet, applyPunchUpload }) {
  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <TeacherSearch c={c} todayRecords={records} />
      </div>
      <AttendanceTable c={c} records={records} onOpenTeacher={onOpenTeacher} pushToast={pushToast} clearPunchSheet={clearPunchSheet} />
      <SummarySection c={c} summary={summary} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <AttentionPanel c={c} records={records} onOpenTeacher={onOpenTeacher} />
        <UploadCard c={c} pushToast={pushToast} syncNow={syncNow} lastSync={lastSync}
          watchConnected={watchConnected} setWatchConnected={setWatchConnected} sources={sources} setSources={setSources}
          applyPunchUpload={applyPunchUpload} />
      </div>
    </div>
  );
}


function SummarySection({ c, summary }) {
  const cards = [
    { label: "Scheduled", value: summary.scheduled, icon: CalendarIcon, tone: c.ink },
    { label: "Present", value: summary.present, icon: CheckCircle2, tone: STATUS_META.Present.fg },
    { label: "Late", value: summary.late, icon: Clock, tone: STATUS_META.Late.fg },
    { label: "Absent", value: summary.absent, icon: XCircle, tone: STATUS_META.Absent.fg },
    { label: "Waiting", value: summary.waiting, icon: Timer, tone: STATUS_META.Waiting.fg },
  ];
  const segs = [
    { label: "Present", v: summary.present, color: STATUS_META.Present.dot },
    { label: "Late", v: summary.late, color: STATUS_META.Late.dot },
    { label: "Absent", v: summary.absent, color: STATUS_META.Absent.dot },
    { label: "Waiting", v: summary.waiting, color: STATUS_META.Waiting.dot },
  ];
  const total = Math.max(segs.reduce((s, x) => s + x.v, 0), 1);

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={{ background: c.surface, border: `1px solid ${c.border}`, boxShadow: "0 1px 2px rgba(0,0,0,.03)" }}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[16px] font-bold" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>Attendance overview</h2>
          <p className="text-[13px]" style={{ color: c.inkFaint }}>{summary.scheduled} teachers scheduled today</p>
        </div>
        <div className="text-right">
          <div className="text-[28px] font-extrabold leading-none ff-mono" style={{ color: c.brand, fontFamily: "'Inter Tight', Inter, sans-serif" }}>{summary.pct}%</div>
          <div className="text-[11px] font-medium" style={{ color: c.inkFaint }}>attendance rate</div>
        </div>
      </div>

      <div className="flex h-2.5 w-full rounded-full overflow-hidden mb-6" style={{ background: c.surfaceAlt }}>
        {segs.map((s, i) => (
          <motion.div key={s.label} initial={{ width: 0 }} animate={{ width: `${(s.v / total) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.05 }} style={{ background: s.color }} title={`${s.label}: ${s.v}`} />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {cards.map((cd) => (
          <div key={cd.label} className="rounded-xl p-3.5" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}` }}>
            <div className="flex items-center gap-1.5 mb-2">
              <cd.icon size={14} style={{ color: cd.tone }} />
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: c.inkFaint }}>{cd.label}</span>
            </div>
            <div className="text-[22px] font-extrabold ff-mono" style={{ color: cd.tone, fontFamily: "'Inter Tight', Inter, sans-serif" }}>{cd.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttentionPanel({ c, records, onOpenTeacher }) {
  const absent = records.filter((r) => r.status === "Absent");
  const late = records.filter((r) => r.status === "Late");
  const upcoming = records.filter((r) => r.status === "Waiting").sort((a, b) => a.deadline - b.deadline);

  const Row = ({ r, kind }) => {
    const meta = STATUS_META[kind === "upcoming" ? "Waiting" : kind === "late" ? "Late" : "Absent"];
    return (
      <button onClick={() => onOpenTeacher(r.id)}
        className="w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:brightness-[0.99]"
        style={{ background: c.surfaceAlt, borderLeft: `3px solid ${meta.dot}` }}>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold truncate" style={{ color: c.ink }}>{r.name}</div>
          <div className="text-[11.5px] truncate" style={{ color: c.inkFaint }}>{r.dept}</div>
        </div>
        <div className="text-right shrink-0">
          {kind === "absent" && <div className="text-[11px] font-medium" style={{ color: meta.fg }}>Missed {minToLabel(r.deadline)}</div>}
          {kind === "late" && <div className="text-[11px] font-semibold" style={{ color: meta.fg }}>+{r.delay} min</div>}
          {kind === "upcoming" && <div className="text-[11px] font-medium" style={{ color: meta.fg }}>Due {minToLabel(r.deadline)}</div>}
        </div>
      </button>
    );
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "#FBE6E5" }}>
          <AlertTriangle size={14} style={{ color: "#D5333B" }} />
        </div>
        <h3 className="text-[14px] font-bold" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>Needs attention</h3>
      </div>

      <div className="space-y-4 max-h-[520px] overflow-y-auto pr-0.5">
        {absent.length > 0 && (
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide mb-2" style={{ color: STATUS_META.Absent.fg }}>Absent · {absent.length}</div>
            <div className="space-y-2">{absent.map((r) => <Row key={r.id} r={r} kind="absent" />)}</div>
          </div>
        )}
        {late.length > 0 && (
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide mb-2" style={{ color: STATUS_META.Late.fg }}>Late · {late.length}</div>
            <div className="space-y-2">{late.map((r) => <Row key={r.id} r={r} kind="late" />)}</div>
          </div>
        )}
        {upcoming.length > 0 && (
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide mb-2" style={{ color: STATUS_META.Waiting.fg }}>Upcoming deadlines · {upcoming.length}</div>
            <div className="space-y-2">{upcoming.map((r) => <Row key={r.id} r={r} kind="upcoming" />)}</div>
          </div>
        )}
        {absent.length + late.length + upcoming.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 size={28} style={{ color: c.brand, margin: "0 auto 8px" }} />
            <p className="text-[12.5px]" style={{ color: c.inkFaint }}>All caught up — nothing needs attention.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadCard({ c, pushToast, syncNow, lastSync, watchConnected, setWatchConnected, sources, setSources, applyPunchUpload }) {
  const [refreshing, setRefreshing] = useState(false);
  const ttRef = React.useRef(null);
  const psRef = React.useRef(null);
  const replace = (kind) => async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (kind === "punch") {
      try {
        const map = await parsePunchFile(f);
        applyPunchUpload(map, f.name);
      } catch {
        pushToast("Could not read punch sheet", "Expected columns for teacher name and punch time.", "error");
      }
      return;
    }
    setSources((s) => ({ ...s, timetable: f.name }));
    pushToast("Timetable replaced", `${f.name} imported and applied.`, "success");
  };
  const doRefresh = () => { setRefreshing(true); syncNow(true); setTimeout(() => setRefreshing(false), 800); };
  return (
    <div className="rounded-2xl p-5" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
      <h3 className="text-[13px] font-bold mb-3" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>Data sources</h3>
      <div className="space-y-2.5">
        <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: c.surfaceAlt }}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.brandSoft }}>
            <FileSpreadsheet size={15} style={{ color: c.brand }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold truncate">Timetable</div>
            <div className="text-[11px] truncate" style={{ color: c.inkFaint }}>{sources.timetable} · 14 teachers</div>
          </div>
          <input ref={ttRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={replace("timetable")} />
          <button onClick={() => ttRef.current?.click()}
            className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0 inline-flex items-center gap-1" style={{ color: c.brand, background: c.brandSoft }}>
            <Upload size={12} /> Replace
          </button>
        </div>
        <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: c.surfaceAlt }}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.brandSoft }}>
            <PlugZap size={15} style={{ color: c.brand }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold truncate">Today's Punch Sheet</div>
            <div className="text-[11px] truncate" style={{ color: c.inkFaint }}>{sources.punch} · synced {lastSync.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</div>
          </div>
          <input ref={psRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={replace("punch")} />
          <button onClick={() => psRef.current?.click()}
            className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0 inline-flex items-center gap-1" style={{ color: c.brand, background: c.brandSoft }}>
            <Upload size={12} /> Replace
          </button>
          <button onClick={doRefresh} title="Refresh"
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg shrink-0" style={{ color: c.brand, background: c.brandSoft }}>
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: c.surfaceAlt }}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.brandSoft }}>
            <FolderSync size={15} style={{ color: c.brand }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold truncate">Watch folder</div>
            <div className="text-[11px]" style={{ color: watchConnected ? c.brand : STATUS_META.Absent.fg }}>
              {watchConnected ? "● Connected · auto-syncing" : "● Disconnected · reconnecting…"}
            </div>
          </div>
          <button onClick={() => { setWatchConnected(false); pushToast("Connection dropped", "Watch folder will reconnect automatically.", "info"); }}
            className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0" style={{ color: c.inkMuted, background: c.surface, border: `1px solid ${c.border}` }}>
            Test drop
          </button>
        </div>
      </div>
      <p className="text-[10.5px] mt-3 leading-relaxed" style={{ color: c.inkFaint }}>
        New punches import automatically every few seconds; the watch folder reconnects on its own if the link drops.
      </p>
    </div>
  );
}


/* ------------------------------- ATTENDANCE TABLE ------------------------------ */

const TABLE_COLS = [
  { key: "name", label: "Teacher" },
  { key: "dept", label: "Department" },
  { key: "subject", label: "Subject" },
  { key: "firstClass", label: "First Class" },
  { key: "deadline", label: "Reporting Deadline" },
  { key: "punch", label: "Punch Time" },
  { key: "delay", label: "Delay" },
  { key: "status", label: "Status" },
];

function exportCSV(rows, filename) {
  const header = Object.keys(rows[0] || {}).join(",");
  const body = rows.map((r) => Object.values(r).map((v) => `"${v ?? ""}"`).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function exportXLSX(rows, filename, sheetName = "Report") {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 30));
  XLSX.writeFile(wb, filename);
}

async function exportPDF(rows, filename, title) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });
  const head = [Object.keys(rows[0] || { Info: "" })];
  const body = rows.map((r) => Object.values(r).map((v) => (v == null ? "" : String(v))));
  doc.setFontSize(13);
  doc.text(title, 14, 14);
  autoTable(doc, { head, body, startY: 20, styles: { fontSize: 8 }, headStyles: { fillColor: [14, 124, 74] } });
  doc.save(filename);
}


function AttendanceTable({ c, records, onOpenTeacher, pushToast, clearPunchSheet }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState("firstClass");
  const [sortDir, setSortDir] = useState("asc");
  const [visibleCols, setVisibleCols] = useState(TABLE_COLS.map((x) => x.key));
  const [colMenuOpen, setColMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    let rows = records.filter((r) => {
      const q = query.toLowerCase();
      const matchesQ = !q || r.name.toLowerCase().includes(q) || r.dept.toLowerCase().includes(q) || r.subject.toLowerCase().includes(q);
      const matchesS = statusFilter === "All" || r.status === statusFilter;
      return matchesQ && matchesS;
    });
    rows = [...rows].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (av == null) av = -Infinity; if (bv == null) bv = -Infinity;
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return rows;
  }, [records, query, statusFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const col = (key) => visibleCols.includes(key);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderBottom: `1px solid ${c.border}` }}>
        <div>
          <h3 className="text-[14px] font-bold" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>Today's attendance</h3>
          <p className="text-[11.5px]" style={{ color: c.inkFaint }}>{filtered.length} of {records.length} teachers</p>
        </div>
        <div className="sm:ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: c.inkFaint }} />
            <input value={query} onChange={(e) => { setQuery(e.target.value); }}
              placeholder="Search teacher, department, subject…"
              className="pl-8 pr-3 h-9 rounded-lg text-[12.5px] outline-none w-56"
              style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.ink }} />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); }}
            className="h-9 rounded-lg text-[12.5px] px-2.5 outline-none" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.ink }}>
            {["All", "Present", "Late", "Absent", "Waiting", "Leave", "Holiday"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="relative">
            <button onClick={() => setColMenuOpen((o) => !o)} className="h-9 w-9 inline-flex items-center justify-center rounded-lg"
              style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.inkMuted }} title="Columns">
              <Columns3 size={15} />
            </button>
            {colMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl p-2 z-20" style={{ background: c.surface, border: `1px solid ${c.border}`, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
                {TABLE_COLS.map((cc) => (
                  <label key={cc.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] cursor-pointer" style={{ color: c.ink }}>
                    <input type="checkbox" checked={col(cc.key)} onChange={() => setVisibleCols((v) => v.includes(cc.key) ? v.filter((k) => k !== cc.key) : [...v, cc.key])} />
                    {cc.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              exportCSV(filtered.map((r) => ({ Teacher: r.name, Department: r.dept, Subject: r.subject, FirstClass: minToLabel(toMin(r.firstClass) ?? null), Deadline: minToLabel(r.deadline), Punch: minToLabel(r.punch), Status: r.status })), "faculty-flow-today.csv");
              pushToast("Export completed", "Today's attendance was downloaded as CSV.", "success");
            }}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-[12.5px] font-semibold" style={{ background: c.brand, color: "#fff" }}>
            <Download size={13} /> Export
          </button>
          <button onClick={clearPunchSheet}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-[12.5px] font-semibold"
            style={{ background: STATUS_META.Absent.bg, color: STATUS_META.Absent.fg }}>
            <XCircle size={13} /> Clear Punch Sheet
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr style={{ background: c.surfaceAlt }}>
              {col("name") && <Th c={c} label="Teacher" onClick={() => toggleSort("name")} active={sortKey === "name"} dir={sortDir} sticky />}
              {col("dept") && <Th c={c} label="Department" onClick={() => toggleSort("dept")} active={sortKey === "dept"} dir={sortDir} />}
              {col("subject") && <Th c={c} label="Subject" onClick={() => toggleSort("subject")} active={sortKey === "subject"} dir={sortDir} />}
              {col("firstClass") && <Th c={c} label="First Class" />}
              {col("deadline") && <Th c={c} label="Deadline" onClick={() => toggleSort("deadline")} active={sortKey === "deadline"} dir={sortDir} />}
              {col("punch") && <Th c={c} label="Punch Time" onClick={() => toggleSort("punch")} active={sortKey === "punch"} dir={sortDir} />}
              {col("delay") && <Th c={c} label="Delay" />}
              {col("status") && <Th c={c} label="Status" onClick={() => toggleSort("status")} active={sortKey === "status"} dir={sortDir} />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} onClick={() => onOpenTeacher(r.id)} className="cursor-pointer transition-colors"
                style={{ borderTop: `1px solid ${c.border}` }}
                onMouseEnter={(e) => e.currentTarget.style.background = c.surfaceAlt}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                {col("name") && <td className="px-4 py-3 font-semibold whitespace-nowrap">{r.name}</td>}
                {col("dept") && <td className="px-4 py-3 whitespace-nowrap" style={{ color: c.inkMuted }}>{r.dept}</td>}
                {col("subject") && <td className="px-4 py-3 whitespace-nowrap" style={{ color: c.inkMuted }}>{r.subject}</td>}
                {col("firstClass") && <td className="px-4 py-3 whitespace-nowrap ff-mono" style={{ color: c.inkMuted }}>{r.firstClass ? minToLabel(toMin(r.firstClass)) : "—"}</td>}
                {col("deadline") && <td className="px-4 py-3 whitespace-nowrap ff-mono" style={{ color: c.inkMuted }}>{minToLabel(r.deadline)}</td>}
                {col("punch") && <td className="px-4 py-3 whitespace-nowrap ff-mono" style={{ color: c.inkMuted }}>{minToLabel(r.punch)}</td>}
                {col("delay") && <td className="px-4 py-3 whitespace-nowrap ff-mono" style={{ color: r.status === "Late" ? STATUS_META.Late.fg : c.inkFaint }}>{r.status === "Late" ? `+${r.delay} min` : "—"}</td>}
                {col("status") && <td className="px-4 py-3 whitespace-nowrap"><Badge status={r.status} /></td>}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12" style={{ color: c.inkFaint }}>{records.length === 0 ? "No punch data. Upload today's punch sheet to begin." : "No teachers match your search."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 sm:px-5 py-3 text-[11.5px]" style={{ borderTop: `1px solid ${c.border}`, color: c.inkFaint }}>
        Showing all {filtered.length} records
      </div>
    </div>
  );
}

function Th({ c, label, onClick, active, dir, sticky }) {
  return (
    <th onClick={onClick}
      className={`px-4 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-wide whitespace-nowrap ${onClick ? "cursor-pointer select-none" : ""}`}
      style={{ color: active ? c.brand : c.inkFaint }}>
      <span className="inline-flex items-center gap-1">
        {label}
        {onClick && (active ? (dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronsUpDown size={11} style={{ opacity: 0.5 }} />)}
      </span>
    </th>
  );
}

/* -------------------------------- TEACHER DRAWER ------------------------------- */

function TeacherDrawer({ c, teacherId, onClose, todayRecords }) {
  const teacher = TEACHERS.find((t) => t.id === teacherId);
  const today = todayRecords.find((r) => r.id === teacherId);
  const history = useMemo(() => (teacherId ? buildHistory(teacherId, 30) : []), [teacherId]);
  const mStats = useMemo(() => (teacherId ? monthStats(teacherId, today) : null), [teacherId, today]);

  const stats = useMemo(() => {
    if (!history.length) return null;
    const working = history.filter((h) => h.status !== "Holiday");
    const present = working.filter((h) => h.status === "Present").length;
    const late = working.filter((h) => h.status === "Late").length;
    const absent = working.filter((h) => h.status === "Absent").length;
    const pct = working.length ? Math.round(((present + late) / working.length) * 100) : 0;
    return { workingDays: working.length, present, late, absent, pct };
  }, [history]);

  const chartData = history.slice(-14).map((h) => ({
    day: h.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    delay: h.status === "Late" ? h.delay : h.status === "Absent" ? null : 0,
    status: h.status,
  }));

  return (
    <AnimatePresence>
      {teacher && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
          <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: "tween", duration: 0.22 }}
            className="fixed inset-y-0 right-0 w-full max-w-md z-50 overflow-y-auto"
            style={{ background: c.surface, borderLeft: `1px solid ${c.border}` }}>
            <div className="p-5 flex items-start gap-3 sticky top-0 z-10" style={{ background: c.surface, borderBottom: `1px solid ${c.border}` }}>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center font-bold text-[15px] shrink-0" style={{ background: c.brandSoft, color: c.brand }}>
                {teacher.name.split(" ").filter(w => w[0] === w[0].toUpperCase() && !w.endsWith(".")).slice(-2).map(w => w[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold truncate" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>{teacher.name}</div>
                <div className="text-[12px] flex items-center gap-1" style={{ color: c.inkFaint }}><Building2 size={11} /> {teacher.dept}</div>
              </div>
              <button onClick={onClose} className="h-8 w-8 inline-flex items-center justify-center rounded-lg shrink-0" style={{ color: c.inkFaint }}><X size={16} /></button>
            </div>

            <div className="p-5 space-y-5">
              <div className="rounded-xl p-4" style={{ background: c.surfaceAlt }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: c.inkFaint }}>Today's schedule</span>
                  {today && <Badge status={today.status} />}
                </div>
                <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                  <div><div style={{ color: c.inkFaint }} className="text-[11px]">Subject</div><div className="font-semibold">{teacher.subject}</div></div>
                  <div><div style={{ color: c.inkFaint }} className="text-[11px]">Reporting time</div><div className="font-semibold ff-mono">{today ? minToLabel(today.deadline) : "—"}</div></div>
                  <div><div style={{ color: c.inkFaint }} className="text-[11px]">Punch time</div><div className="font-semibold ff-mono">{today ? minToLabel(today.punch) : "—"}</div></div>
                  <div><div style={{ color: c.inkFaint }} className="text-[11px]">Delay</div><div className="font-semibold ff-mono">{today?.status === "Late" ? `+${today.delay} min` : "—"}</div></div>
                </div>
              </div>

              {stats && (
                <div className="grid grid-cols-4 gap-2.5">
                  <StatMini c={c} label="Attendance" value={`${stats.pct}%`} tone={c.brand} />
                  <StatMini c={c} label="Late (30d)" value={stats.late} tone={STATUS_META.Late.fg} />
                  <StatMini c={c} label={`Late in ${DEMO_DATE.toLocaleDateString("en-IN", { month: "short" })}`} value={mStats.late} tone={STATUS_META.Late.fg} />
                  <StatMini c={c} label="Absent (30d)" value={stats.absent} tone={STATUS_META.Absent.fg} />
                </div>
              )}

              {mStats && (
                <div className="rounded-xl p-4" style={{ background: STATUS_META.Late.bg }}>
                  <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: STATUS_META.Late.fg }}>
                    Late arrivals · {mStats.month}
                  </div>
                  <div className="text-[13px] mt-1" style={{ color: STATUS_META.Late.fg }}>
                    Late <b>{mStats.late}</b> {mStats.late === 1 ? "time" : "times"} out of {mStats.workingDays} working days
                    {mStats.late > 0 && <> · avg delay <b>+{mStats.avgLate} min</b></>}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: c.inkFaint }}>Delay trend · last 14 working days</div>
                <div className="h-40 rounded-xl p-2" style={{ background: c.surfaceAlt }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 9, fill: c.inkFaint }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: c.inkFaint }} axisLine={false} tickLine={false} width={24} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${c.border}` }} />
                      <Bar dataKey="delay" radius={[4, 4, 0, 0]}>
                        {chartData.map((d, i) => (
                          <Cell key={i} fill={d.status === "Absent" ? STATUS_META.Absent.dot : d.status === "Late" ? STATUS_META.Late.dot : d.status === "Holiday" ? c.borderStrong : STATUS_META.Present.dot} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: c.inkFaint }}>Recent attendance</div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {history.slice(-10).reverse().map((h, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: c.surfaceAlt }}>
                      <span className="text-[12px]" style={{ color: c.inkMuted }}>{h.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", weekday: "short" })}</span>
                      <Badge status={h.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatMini({ c, label, value, tone }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: c.surfaceAlt }}>
      <div className="text-[16px] font-extrabold ff-mono" style={{ color: tone, fontFamily: "'Inter Tight', Inter, sans-serif" }}>{value}</div>
      <div className="text-[10px] font-medium mt-0.5" style={{ color: c.inkFaint }}>{label}</div>
    </div>
  );
}

/* ---------------------------------- HISTORY ----------------------------------- */

function toDateInput(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function fromDateInput(v) { const [y, m, d] = v.split("-").map(Number); return new Date(y, m - 1, d); }

function HistoryPage({ c, onOpenTeacher, pushToast, teachers = [], refreshKey }) {
  const today = new Date();
  const [startDate, setStartDate] = useState(toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [endDate, setEndDate] = useState(toDateInput(today));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const allRows = useMemo(() => historyRows(), [refreshKey]);

  const rangeRows = useMemo(() => {
    const s = fromDateInput(startDate);
    const e = endDate ? fromDateInput(endDate) : fromDateInput(startDate);
    s.setHours(0, 0, 0, 0); e.setHours(23, 59, 59, 999);
    return allRows.filter((r) => r.date >= s && r.date <= e);
  }, [allRows, startDate, endDate]);

  const matchedTeacher = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const pool = teachers.length ? teachers : allRows.map((r) => ({ id: r.id, name: r.teacher, dept: r.dept }));
    return pool.find((t) => t.name.toLowerCase().includes(q)) || null;
  }, [query, teachers, allRows]);


  const scopedRows = useMemo(() => (matchedTeacher ? rangeRows.filter((r) => r.id === matchedTeacher.id) : rangeRows), [rangeRows, matchedTeacher]);
  const tableRows = useMemo(() => [...scopedRows]
    .filter((r) => statusFilter === "All" || r.status === statusFilter)
    .sort((a, b) => b.date - a.date), [scopedRows, statusFilter]);

  const kpis = useMemo(() => {
    const working = scopedRows.filter((r) => r.status !== "Holiday");
    const present = working.filter((r) => r.status === "Present").length;
    const late = working.filter((r) => r.status === "Late").length;
    const absent = working.filter((r) => r.status === "Absent").length;
    const delays = working.filter((r) => r.status === "Late").map((r) => r.delay || 0);
    return {
      workingDays: new Set(working.map((r) => r.date.toDateString())).size,
      presentPct: working.length ? Math.round((present / working.length) * 100) : 0,
      latePct: working.length ? Math.round((late / working.length) * 100) : 0,
      absentPct: working.length ? Math.round((absent / working.length) * 100) : 0,
      lateCount: late,
      absentCount: absent,
      avgDelay: delays.length ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : 0,
    };
  }, [scopedRows]);

  const dailyTrend = useMemo(() => {
    const byDate = {};
    [...scopedRows].sort((a, b) => a.date - b.date).forEach((r) => {
      const key = r.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      byDate[key] = byDate[key] || { date: key, present: 0, total: 0 };
      if (r.status !== "Holiday") { byDate[key].total++; if (r.status === "Present" || r.status === "Late") byDate[key].present++; }
    });
    return Object.values(byDate).map((d) => ({ date: d.date, pct: d.total ? Math.round((d.present / d.total) * 100) : 0 }));
  }, [scopedRows]);

  const deptComparison = useMemo(() => {
    const byDept = {};
    scopedRows.forEach((r) => {
      if (r.status === "Holiday") return;
      byDept[r.dept] = byDept[r.dept] || { dept: r.dept, present: 0, total: 0 };
      byDept[r.dept].total++;
      if (r.status === "Present" || r.status === "Late") byDept[r.dept].present++;
    });
    return Object.values(byDept).map((d) => ({ dept: d.dept.replace(" (ECE)", ""), pct: Math.round((d.present / d.total) * 100) }));
  }, [scopedRows]);

  const teacherRanking = useMemo(() => {
    const byT = {};
    scopedRows.forEach((r) => {
      if (r.status === "Holiday") return;
      byT[r.id] = byT[r.id] || { name: r.teacher, present: 0, total: 0 };
      byT[r.id].total++;
      if (r.status === "Present") byT[r.id].present++;
    });
    return Object.values(byT).map((t) => ({ name: t.name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s/, ""), pct: Math.round((t.present / t.total) * 100) }))
      .sort((a, b) => b.pct - a.pct).slice(0, 8);
  }, [scopedRows]);

  const lateTrend = useMemo(() => {
    const byWeek = {};
    scopedRows.forEach((r) => {
      if (r.status !== "Late") return;
      const wk = `W${Math.ceil(r.date.getDate() / 7)} ${r.date.toLocaleDateString("en-IN", { month: "short" })}`;
      byWeek[wk] = (byWeek[wk] || 0) + 1;
    });
    return Object.entries(byWeek).map(([week, count]) => ({ week, count }));
  }, [scopedRows]);

  const rangeLabel = `${fromDateInput(startDate).toLocaleDateString("en-IN")}${endDate && endDate !== startDate ? ` – ${fromDateInput(endDate).toLocaleDateString("en-IN")}` : ""}`;
  const scopeLabel = matchedTeacher ? matchedTeacher.name : "All teachers";
  const exportRows = () => tableRows.map((r) => ({
    Date: r.date.toLocaleDateString("en-IN"),
    Teacher: r.teacher,
    Department: r.dept,
    Deadline: minToLabel(r.deadline),
    Punch: minToLabel(r.punch),
    Delay: r.status === "Late" ? `${r.delay} min` : "",
    Status: r.status,
  }));
  const fileBase = `faculty-flow-${matchedTeacher ? matchedTeacher.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() : "all-teachers"}`;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-4 flex flex-col lg:flex-row lg:items-end gap-3" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: c.inkFaint }}>From date</div>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="h-9 px-2.5 rounded-lg text-[12.5px] outline-none" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.ink }} />
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: c.inkFaint }}>To date (optional)</div>
          <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)}
            className="h-9 px-2.5 rounded-lg text-[12.5px] outline-none" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.ink }} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: c.inkFaint }}>Search teacher</div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: c.inkFaint }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a teacher's name…"
              className="w-full pl-8 pr-3 h-9 rounded-lg text-[12.5px] outline-none" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.ink }} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={async () => { await exportXLSX(exportRows(), `${fileBase}.xlsx`, "History"); pushToast("Excel exported", `${scopeLabel} · ${rangeLabel}`, "success"); }}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-[12.5px] font-semibold" style={{ background: c.brand, color: "#fff" }}>
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button onClick={async () => { await exportPDF(exportRows(), `${fileBase}.pdf`, `${scopeLabel} · ${rangeLabel}`); pushToast("PDF exported", `${scopeLabel} · ${rangeLabel}`, "success"); }}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-[12.5px] font-semibold" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.inkMuted }}>
            <Download size={13} /> PDF
          </button>
        </div>
      </div>

      {query.trim() && !matchedTeacher && (
        <div className="rounded-2xl p-4 text-[12.5px]" style={{ background: c.surface, border: `1px solid ${c.border}`, color: c.inkFaint }}>
          No teacher matches "{query}". Showing no records.
        </div>
      )}

      {matchedTeacher && (
        <div className="rounded-2xl p-5" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
          <h3 className="text-[15px] font-bold" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>{matchedTeacher.name}</h3>
          <p className="text-[12.5px] mt-1" style={{ color: c.inkMuted }}>
            {matchedTeacher.dept} · {rangeLabel} — <strong style={{ color: STATUS_META.Absent.fg }}>Total Days Absent: {kpis.absentCount}</strong> · <strong style={{ color: STATUS_META.Late.fg }}>Total Times Late: {kpis.lateCount}</strong>
          </p>
        </div>
      )}

      <div>
        <h2 className="text-[16px] font-bold mb-3" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>{scopeLabel} · {rangeLabel}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard c={c} label="Working days" value={kpis.workingDays} />
          <KpiCard c={c} label="Present %" value={`${kpis.presentPct}%`} tone={STATUS_META.Present.fg} />
          <KpiCard c={c} label="Late %" value={`${kpis.latePct}%`} tone={STATUS_META.Late.fg} />
          <KpiCard c={c} label="Absent %" value={`${kpis.absentPct}%`} tone={STATUS_META.Absent.fg} />
          <KpiCard c={c} label="Times late" value={kpis.lateCount} tone={STATUS_META.Late.fg} />
          <KpiCard c={c} label="Avg delay" value={`${kpis.avgDelay}m`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard c={c} title="Daily attendance trend">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyTrend}>
              <defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c.brand} stopOpacity={0.35} /><stop offset="100%" stopColor={c.brand} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: c.inkFaint }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: c.inkFaint }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Area type="monotone" dataKey="pct" stroke={c.brand} strokeWidth={2} fill="url(#gArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard c={c} title="Department comparison">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptComparison} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: c.inkFaint }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 9.5, fill: c.inkMuted }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="pct" fill={c.brand} radius={[0, 6, 6, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard c={c} title="Late arrivals trend">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lateTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: c.inkFaint }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: c.inkFaint }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke={STATUS_META.Late.fg} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard c={c} title="Teacher ranking · attendance %">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={teacherRanking} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: c.inkFaint }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: c.inkMuted }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={11}>
                {teacherRanking.map((_, i) => <Cell key={i} fill={i < 3 ? c.brand : c.borderStrong} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderBottom: `1px solid ${c.border}` }}>
          <h3 className="text-[14px] font-bold" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>History records</h3>
          <div className="sm:ml-auto flex flex-wrap items-center gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg text-[12.5px] px-2.5 outline-none" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.ink }}>
              {["All", "Present", "Late", "Absent", "Leave", "Holiday"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr style={{ background: c.surfaceAlt }}>
                <Th c={c} label="Date" />
                <Th c={c} label="Teacher" />
                <Th c={c} label="Department" />
                <Th c={c} label="Reporting Deadline" />
                <Th c={c} label="Punch Time" />
                <Th c={c} label="Delay" />
                <Th c={c} label="Status" />
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r, i) => (
                <tr key={i} onClick={() => onOpenTeacher(r.id)} className="cursor-pointer" style={{ borderTop: `1px solid ${c.border}` }}
                  onMouseEnter={(e) => e.currentTarget.style.background = c.surfaceAlt} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td className="px-4 py-3 whitespace-nowrap ff-mono" style={{ color: c.inkMuted }}>{r.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold">{r.teacher}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: c.inkMuted }}>{r.dept}</td>
                  <td className="px-4 py-3 whitespace-nowrap ff-mono" style={{ color: c.inkMuted }}>{minToLabel(r.deadline)}</td>
                  <td className="px-4 py-3 whitespace-nowrap ff-mono" style={{ color: c.inkMuted }}>{minToLabel(r.punch)}</td>
                  <td className="px-4 py-3 whitespace-nowrap ff-mono" style={{ color: c.inkFaint }}>{r.status === "Late" ? `+${r.delay}m` : "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><Badge status={r.status} /></td>
                </tr>
              ))}
              {tableRows.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: c.inkFaint }}>No records for this selection.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-5 py-3 text-[11.5px]" style={{ borderTop: `1px solid ${c.border}`, color: c.inkFaint }}>{tableRows.length} records</div>
      </div>
    </div>
  );
}


function KpiCard({ c, label, value, tone }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
      <div className="text-[10.5px] font-bold uppercase tracking-wide mb-1" style={{ color: c.inkFaint }}>{label}</div>
      <div className="text-[19px] font-extrabold ff-mono" style={{ color: tone || c.ink, fontFamily: "'Inter Tight', Inter, sans-serif" }}>{value}</div>
    </div>
  );
}

function ChartCard({ c, title, children }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
      <h4 className="text-[12.5px] font-bold mb-2" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>{title}</h4>
      {children}
    </div>
  );
}


/* --------------------------------- SETTINGS ------------------------------------ */

function SettingsPage({ c, themeMode, setThemeMode, pushToast }) {
  const [workingDays, setWorkingDays] = useState({ Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false });
  const [holidays, setHolidays] = useState([
    { date: "15 Aug 2026", name: "Independence Day" },
    { date: "02 Oct 2026", name: "Gandhi Jayanti" },
    { date: "12 Nov 2026", name: "Diwali" },
  ]);
  const [exportFmt, setExportFmt] = useState("Excel");

  const Section = ({ title, icon: Icon, children, desc }) => (
    <div className="rounded-2xl p-5" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: c.brandSoft }}><Icon size={15} style={{ color: c.brand }} /></div>
        <h3 className="text-[14px] font-bold" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>{title}</h3>
      </div>
      {desc && <p className="text-[11.5px] mb-4 ml-[42px]" style={{ color: c.inkFaint }}>{desc}</p>}
      <div className={desc ? "ml-[42px]" : ""}>{children}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
      <Section title="Working days" icon={CalendarIcon} desc="Days the institution holds classes.">
        <div className="flex flex-wrap gap-2">
          {Object.keys(workingDays).map((d) => (
            <button key={d} onClick={() => setWorkingDays((w) => ({ ...w, [d]: !w[d] }))}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
              style={{ background: workingDays[d] ? c.brandSoft : c.surfaceAlt, color: workingDays[d] ? c.brand : c.inkFaint, border: `1px solid ${workingDays[d] ? c.brand + "33" : c.border}` }}>
              {d}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Holiday calendar" icon={Coffee} desc="Dates with no classes are automatically excluded from reporting.">
        <div className="space-y-1.5">
          {holidays.map((h, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: c.surfaceAlt }}>
              <span className="text-[12px] font-medium">{h.name}</span>
              <span className="text-[11.5px] ff-mono" style={{ color: c.inkFaint }}>{h.date}</span>
            </div>
          ))}
        </div>
        <button onClick={() => pushToast("Holiday added", "Remember to save the calendar to apply it.", "info")}
          className="mt-3 text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: c.brandSoft, color: c.brand }}>+ Add holiday</button>
      </Section>

      <Section title="Import settings" icon={Upload} desc="How Faculty Flow reconciles imported records.">
        <div className="space-y-2 text-[12.5px]" style={{ color: c.inkMuted }}>
          {["Ignore duplicate punches", "Ignore blank rows", "Use earliest punch of the day", "Case-insensitive teacher matching"].map((s) => (
            <label key={s} className="flex items-center gap-2"><input type="checkbox" defaultChecked /> {s}</label>
          ))}
        </div>
      </Section>

      <Section title="Export preferences" icon={FileSpreadsheet} desc="Default format for downloaded reports.">
        <div className="flex gap-2">
          {["Excel", "CSV", "PDF"].map((f) => (
            <button key={f} onClick={() => setExportFmt(f)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold"
              style={{ background: exportFmt === f ? c.brand : c.surfaceAlt, color: exportFmt === f ? "#fff" : c.inkMuted }}>{f}</button>
          ))}
        </div>
      </Section>

      <Section title="Theme" icon={Sun}>
        <div className="flex gap-2">
          {[["light", Sun, "Light"], ["dark", Moon, "Dark"], ["system", Monitor, "System"]].map(([mode, Icon, label]) => (
            <button key={mode} onClick={() => setThemeMode(mode)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-[12px] font-semibold"
              style={{ background: themeMode === mode ? c.brandSoft : c.surfaceAlt, color: themeMode === mode ? c.brand : c.inkMuted, border: `1px solid ${themeMode === mode ? c.brand + "33" : c.border}` }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ----------------------------------- TOASTS ------------------------------------ */

function ToastStack({ c, toasts }) {
  const iconFor = (kind) => kind === "success" ? CheckCircle2 : kind === "sync" ? RefreshCw : kind === "info" ? Bell : AlertTriangle;
  const colorFor = (kind) => kind === "success" ? c.brand : kind === "sync" ? "#2E6FDB" : kind === "info" ? c.inkMuted : "#D5333B";
  return (
    <div className="fixed bottom-4 right-4 z-[60] space-y-2 w-[calc(100%-2rem)] max-w-sm">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = iconFor(t.kind);
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }}
              className="rounded-xl p-3.5 flex items-start gap-3" style={{ background: c.surface, border: `1px solid ${c.border}`, boxShadow: "0 12px 32px rgba(0,0,0,.14)" }}>
              <Icon size={16} style={{ color: colorFor(t.kind) }} className="shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold">{t.title}</div>
                <div className="text-[11.5px] mt-0.5" style={{ color: c.inkFaint }}>{t.desc}</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
/* ------------------------------ TEACHER SEARCH -------------------------------- */

function TeacherSearch({ c, todayRecords, teachers = [] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return teachers.filter((t) => t.name.toLowerCase().includes(s) || (t.dept || "").toLowerCase().includes(s)).slice(0, 6);
  }, [q, teachers]);

  const today = selected ? todayRecords.find((r) => r.id === selected.id) : null;
  const ms = useMemo(() => (selected ? monthStats(selected.id, today) : null), [selected, today]);


  return (
    <div className="relative w-full">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.inkFaint }} />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search a teacher's name…"
        className="w-full pl-9 pr-3 h-10 rounded-xl text-[13px] outline-none"
        style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.ink }}
      />

      <AnimatePresence>
        {open && matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 mt-1.5 rounded-xl p-1.5 z-50"
            style={{ background: c.surface, border: `1px solid ${c.border}`, boxShadow: "0 12px 30px rgba(0,0,0,.14)" }}
          >
            {matches.map((t) => {
              const m = monthStats(t.id, todayRecords.find((r) => r.id === t.id));
              return (
                <button
                  key={t.id}
                  onClick={() => { setSelected(t); setOpen(false); setQ(t.name); }}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left"
                  style={{ color: c.ink }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = c.surfaceAlt)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold truncate">{t.name}</div>
                    <div className="text-[11px] truncate" style={{ color: c.inkFaint }}>{t.dept}</div>
                  </div>
                  <span className="text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-full"
                    style={{ color: STATUS_META.Late.fg, background: STATUS_META.Late.bg }}>
                    {m.late} late
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && ms && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/45 z-[70]" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="fixed z-[80] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg rounded-2xl overflow-hidden"
              style={{ background: c.surface, border: `1px solid ${c.border}`, boxShadow: "0 24px 60px rgba(0,0,0,.28)" }}
            >
              <div className="p-5 flex items-start gap-3" style={{ borderBottom: `1px solid ${c.border}` }}>
                <div className="h-11 w-11 rounded-xl flex items-center justify-center font-bold text-[15px] shrink-0"
                  style={{ background: c.brandSoft, color: c.brand }}>
                  {selected.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold truncate" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>{selected.name}</div>
                  <div className="text-[12px] flex items-center gap-1" style={{ color: c.inkFaint }}>
                    <Building2 size={11} /> {selected.dept}
                  </div>
                </div>
                {today && <Badge status={today.status} />}
                <button onClick={() => setSelected(null)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg shrink-0" style={{ color: c.inkFaint }}>
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: STATUS_META.Late.bg }}>
                  <div className="text-[34px] font-extrabold ff-mono leading-none" style={{ color: STATUS_META.Late.fg, fontFamily: "'Inter Tight', Inter, sans-serif" }}>
                    {ms.late}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold" style={{ color: STATUS_META.Late.fg }}>
                      late {ms.late === 1 ? "arrival" : "arrivals"} in {ms.month}
                    </div>
                    <div className="text-[11.5px]" style={{ color: STATUS_META.Late.fg }}>
                      {ms.workingDays} working days recorded{ms.late > 0 ? ` · avg delay +${ms.avgLate} min · ${ms.totalLateMin} min total` : ""}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  <StatMini c={c} label="Attendance" value={`${ms.pct}%`} tone={c.brand} />
                  <StatMini c={c} label="Present" value={ms.present} tone={STATUS_META.Present.fg} />
                  <StatMini c={c} label="Absent" value={ms.absent} tone={STATUS_META.Absent.fg} />
                  <StatMini c={c} label="Leave" value={ms.leave} tone={STATUS_META.Leave.fg} />
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: c.inkFaint }}>
                    Late days this month
                  </div>
                  {ms.lateRows.length === 0 ? (
                    <div className="rounded-xl p-4 text-center text-[12.5px]" style={{ background: c.surfaceAlt, color: c.inkFaint }}>
                      No late arrivals this month — perfect punctuality.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {ms.lateRows.map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: c.surfaceAlt }}>
                          <span className="text-[12px]" style={{ color: c.inkMuted }}>
                            {r.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", weekday: "short" })}
                          </span>
                          <span className="text-[12px] font-semibold ff-mono" style={{ color: STATUS_META.Late.fg }}>+{r.delay} min</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
