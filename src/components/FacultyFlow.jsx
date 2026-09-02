import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  LayoutDashboard, History as HistoryIcon, Settings as SettingsIcon,
  Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsUpDown,
  Upload, RefreshCw, CheckCircle2, Clock, XCircle, AlertTriangle,
  Sun, Moon, Monitor, Download, X, Menu, ArrowUpDown, Calendar as CalendarIcon,
  TrendingUp, Users, FileSpreadsheet, Bell, ChevronRight as ChevronRightIcon,
  FolderSync, PlugZap, Coffee, PauseCircle, SlidersHorizontal, Columns3,
  ArrowRight, Building2, BookOpen, Timer, PieChart as PieChartIcon, Trash2, CalendarPlus
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

/* --------------------------------- DATA LAYER ------------------------------ */

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATE_KEY = "ff_state";
const HISTORY_KEY = "ff_history_store";

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
function pad2(n) { return String(n).padStart(2, "0"); }
function dayKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function normName(s) { return String(s).toLowerCase().replace(/\b(dr|mr|mrs|ms|prof|professor)\b/g, "").replace(/[^a-z]/g, ""); }
function deadlineForHour(hour) { return hour === 1 ? 7 * 60 + 55 : hour === 2 ? 8 * 60 + 40 : 9 * 60; }
function hourLabel(hour) { return hour == null ? "—" : hour === 1 ? "1st hr · 8:00 AM" : hour === 2 ? "2nd hr · 8:50 AM" : `Hour ${hour}`; }

function loadState() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; }
}
function persistState(patch) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STATE_KEY, JSON.stringify({ ...loadState(), ...patch })); } catch { /* quota */ }
}
function loadHistoryStore() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "{}"); } catch { return {}; }
}
function writeHistoryStore(store) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(HISTORY_KEY, JSON.stringify(store)); } catch { /* quota */ }
}
function saveHistoryDay(key, records) {
  if (!records.length) return;
  const store = loadHistoryStore();
  store[key] = records.map((r) => ({ id: r.id, teacher: r.name, dept: r.dept, status: r.status, delay: r.delay, deadline: r.deadline, punch: r.punch }));
  writeHistoryStore(store);
}
function deleteHistoryDay(key) {
  const store = loadHistoryStore();
  if (store[key] == null) return;
  delete store[key];
  writeHistoryStore(store);
}
function historyRows() {
  const store = loadHistoryStore();
  const rows = [];
  Object.entries(store).forEach(([key, recs]) => {
    const [y, m, d] = key.split("-").map(Number);
    if (!y || !m || !d) return;
    const date = new Date(y, m - 1, d);
    (recs || []).forEach((r) => rows.push({ ...r, date }));
  });
  return rows;
}

function nameTokens(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !["dr", "mr", "mrs", "ms", "prof", "professor", "miss"].includes(w));
}
function normalizeName(name) { return nameTokens(name); }
function nameScore(aTokens, bTokens) {
  if (!aTokens.length || !bTokens.length) return 0;
  const b = [...bTokens];
  let core = 0, initial = 0;
  aTokens.forEach((w) => {
    let i = b.findIndex((x) => x === w);
    if (i < 0 && w.length > 3) i = b.findIndex((x) => x.length > 3 && (x.startsWith(w) || w.startsWith(x)));
    if (i >= 0) { b.splice(i, 1); if (w.length > 1) core++; else initial++; return; }
    if (w.length === 1) {
      const j = b.findIndex((x) => x[0] === w);
      if (j >= 0) { b.splice(j, 1); initial++; }
    }
  });
  const shorter = Math.min(aTokens.filter((w) => w.length > 1).length, bTokens.filter((w) => w.length > 1).length);
  if (core < Math.min(2, shorter || 1)) return 0;
  return core * 10 + initial;
}
function fuzzyFindTeacher(teachers, rawName) {
  const nt = nameTokens(rawName);
  if (!nt.length) return null;
  let best = null, bestScore = 0;
  teachers.forEach((t) => {
    const s = nameScore(nt, t.tokens || nameTokens(t.name));
    if (s > bestScore) { bestScore = s; best = t; }
  });
  return bestScore > 0 ? best : null;
}

function parseVerticalBlocks(grid, txt, dept) {
  const teachers = [], timetable = {}, subjects = {};
  let currentTeacher = null, currentId = null;
  for (const rawRow of grid) {
    const row = rawRow || [];
    const first = txt(row[0]);
    if (!first) continue;
    const asNum = Number(first);
    const isNum = first !== "" && !isNaN(asNum);
    if (!isNum) {
      if (/^(s\.?\s*no|sl\.?\s*no|day|days|hour|hours|department|staff)\.?:?$/i.test(first)) continue;
      if (first.length < 4 || !/[a-z]{3}/i.test(first)) continue;
      currentTeacher = first;
      currentId = slugify(first);
      continue;
    }
    if (!currentTeacher) continue;
    if (asNum < 1 || asNum > 5) continue;
    const day = DAY_KEYS[asNum];
    let hour = null, subject = "";
    for (let c = 1; c < row.length; c++) {
      const v = txt(row[c]);
      if (v) { hour = c; subject = v; break; }
    }
    if (hour == null) continue;
    if (!timetable[currentId]) {
      timetable[currentId] = {};
      subjects[currentId] = {};
      teachers.push({ id: currentId, name: currentTeacher, dept: dept || "Faculty", tokens: nameTokens(currentTeacher) });
    }
    if (timetable[currentId][day] == null) {
      timetable[currentId][day] = hour;
      subjects[currentId][day] = subject;
    }
  }
  return { teachers, timetable, subjects };
}

async function parseTimetableFile(file) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const txt = (v) => (v == null ? "" : String(v).replace(/\s+/g, " ").trim());
  let dept = "";
  for (const n of wb.SheetNames) {
    const g = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: null, raw: false });
    for (const row of g) {
      const i = (row || []).findIndex((v) => /^department\s*:?$/i.test(txt(v)));
      if (i >= 0) {
        const rest = row.slice(i + 1).find((v) => txt(v));
        if (rest) { dept = txt(rest); break; }
      }
    }
    if (dept) break;
  }
  const grid = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null, raw: false });
  const teachers = [], timetable = {}, subjects = {};
  for (let r = 1; r < grid.length; r++) {
    const row = grid[r] || [];
    for (let cc = 0; cc < row.length; cc++) {
      let header = true;
      for (let h = 1; h <= 7; h++) if (txt(row[cc + h]) !== String(h)) { header = false; break; }
      if (!header) continue;
      const name = txt((grid[r - 1] || [])[cc]);
      if (name.length < 4 || !/[a-z]{3}/i.test(name)) continue;
      const id = slugify(name);
      if (timetable[id]) continue;
      const days = {}, subs = {};
      for (let i = 0; i < 5; i++) {
        const dr = grid[r + 1 + i] || [];
        for (let h = 1; h <= 7; h++) {
          const v = txt(dr[cc + h]);
          if (v) { days[DAY_KEYS[i + 1]] = h; subs[DAY_KEYS[i + 1]] = v; break; }
        }
      }
      if (!Object.keys(days).length) continue;
      teachers.push({ id, name, dept: dept || "Faculty", tokens: nameTokens(name) });
      timetable[id] = days;
      subjects[id] = subs;
    }
  }
  if (!teachers.length) {
    const v = parseVerticalBlocks(grid, txt, dept);
    if (!v.teachers.length) throw new Error("no faculty blocks found");
    return { ...v, dept };
  }
  return { teachers, timetable, subjects, dept };
}

function punchRowsToMap(rows, teachers) {
  const map = {};
  rows.forEach((row) => {
    const entries = Object.entries(row);
    const nameEntry = entries.find(([k]) => /name|teacher|staff|faculty|employee/i.test(k));
    const timeEntry = entries.find(([k]) => /time|punch|in\b/i.test(k));
    if (!nameEntry || !timeEntry) return;
    const raw = timeEntry[1];
    const match = raw instanceof Date && !isNaN(raw)
      ? [null, String(raw.getHours()), String(raw.getMinutes())]
      : String(raw).match(/(\d{1,2}):(\d{2})/);
    if (!match) return;
    const t = fuzzyFindTeacher(teachers, nameEntry[1]);
    if (!t) return;
    const min = Number(match[1]) * 60 + Number(match[2]);
    if (map[t.id] == null || min < map[t.id]) map[t.id] = min;
  });
  return map;
}

async function parsePunchFile(file, teachers) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  return punchRowsToMap(rows, teachers);
}


function findSheetDate(grid, filename) {
  for (const row of grid) {
    for (const v of row || []) {
      if (v instanceof Date && !isNaN(v)) return v;
      const m = String(v ?? "").match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
      if (m) {
        let y = Number(m[3]); if (y < 100) y += 2000;
        const d = new Date(y, Number(m[2]) - 1, Number(m[1]));
        if (!isNaN(d) && d.getFullYear() > 2000) return d;
      }
    }
  }
  const fm = String(filename || "").match(/(\d{1,2})[.\-_ ](\d{1,2})[.\-_ ](\d{2,4})/);
  if (fm) {
    let y = Number(fm[3]); if (y < 100) y += 2000;
    const d = new Date(y, Number(fm[2]) - 1, Number(fm[1]));
    if (!isNaN(d)) return d;
  }
  return null;
}

async function parsePastPunchFile(file, teachers) {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return { map: punchRowsToMap(rows, teachers), date: findSheetDate(grid, file.name) };

}

function mergeHistoryDay(key, records) {
  if (!records.length) return 0;
  const store = loadHistoryStore();
  const byId = {};
  (store[key] || []).forEach((r) => { byId[r.id] = r; });
  records.forEach((r) => { byId[r.id] = { id: r.id, teacher: r.name, dept: r.dept, status: r.status, delay: r.delay, deadline: r.deadline, punch: r.punch }; });
  store[key] = Object.values(byId);
  writeHistoryStore(store);
  return records.length;
}

function buildRecords(tt, punchMap, date, nowMin) {
  if (!tt || !punchMap) return [];
  const wd = DAY_KEYS[date.getDay()];
  return tt.teachers
    .filter((t) => tt.timetable[t.id] && tt.timetable[t.id][wd] != null)
    .map((t) => {
      const hour = tt.timetable[t.id][wd];
      const deadline = deadlineForHour(hour);
      const punch = punchMap[t.id] == null ? null : punchMap[t.id];
      const status = punch != null ? (punch <= deadline ? "Present" : "Late") : nowMin >= deadline ? "Absent" : "Waiting";
      return {
        id: t.id, name: t.name, dept: t.dept, subject: (tt.subjects[t.id] || {})[wd] || "—",
        hour, firstClass: hour, deadline, punch, status,
        delay: status === "Late" ? punch - deadline : null,
      };
    });
}

function monthStats(teacherId, todayRecord) {
  const now = new Date();
  const rows = historyRows().filter((r) => r.id === teacherId && r.date.getMonth() === now.getMonth() && r.date.getFullYear() === now.getFullYear());
  if (todayRecord && !rows.some((r) => dayKey(r.date) === dayKey(now))) rows.push({ date: now, status: todayRecord.status, delay: todayRecord.delay });
  const working = rows.filter((r) => r.status !== "Holiday");
  const lateRows = rows.filter((r) => r.status === "Late");
  const present = rows.filter((r) => r.status === "Present").length;
  const absent = rows.filter((r) => r.status === "Absent").length;
  const leave = rows.filter((r) => r.status === "Leave").length;
  const totalLateMin = lateRows.reduce((a, b) => a + (b.delay || 0), 0);
  return {
    month: now.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    rows, lateRows,
    workingDays: working.length,
    late: lateRows.length,
    present, absent, leave,
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
  const [lastSync, setLastSync] = useState(new Date());
  const [toasts, setToasts] = useState([]);
  const [drawerTeacher, setDrawerTeacher] = useState(null);
  const [watchConnected, setWatchConnected] = useState(true);
  const [tt, setTt] = useState(null);
  const [punchMap, setPunchMap] = useState(null);
  const [sources, setSources] = useState({ timetable: "— no timetable —", punch: "— no punch sheet —" });
  const [historyKey, setHistoryKey] = useState(0);

  const pushToast = useCallback((title, desc, kind = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, title, desc, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const saved = loadState();
    if (saved.tt) { setTt(saved.tt); setSources((s) => ({ ...s, timetable: saved.ttName || "timetable.xlsx" })); }
    if (saved.punch && saved.punchDate === dayKey(new Date())) { setPunchMap(saved.punch); setSources((s) => ({ ...s, punch: saved.punchName || "punch-sheet.xlsx" })); }
  }, []);

  const syncNow = useCallback((manual) => {
    const saved = loadState();
    setLastSync(new Date());
    if (saved.punch && saved.punchDate === dayKey(new Date())) setPunchMap(saved.punch);
    setHistoryKey((k) => k + 1);
    if (manual) pushToast("Sync complete", "Attendance recalculated from the current data sources.", "sync");
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

  const nowMin = clock.getHours() * 60 + clock.getMinutes();
  const todayRecords = useMemo(() => buildRecords(tt, punchMap, clock, nowMin), [tt, punchMap, nowMin]);
  const teachers = tt ? tt.teachers : [];

  useEffect(() => {
    if (!todayRecords.length || !punchMap) return;
    saveHistoryDay(dayKey(new Date()), todayRecords);
    setHistoryKey((k) => k + 1);
  }, [todayRecords, punchMap]);

  const clearPunchSheet = useCallback(() => {
    setPunchMap(null);
    persistState({ punch: null, punchName: null, punchDate: null });
    deleteHistoryDay(dayKey(new Date()));
    setSources((s) => ({ ...s, punch: "— no punch sheet —" }));
    setHistoryKey((k) => k + 1);
    pushToast("Punch sheet cleared", "Today's view is empty. Past days remain in History.", "info");
  }, [pushToast]);

  const applyTimetableUpload = useCallback(async (file) => {
    const parsed = await parseTimetableFile(file);
    setTt(parsed);
    persistState({ tt: parsed, ttName: file.name });
    setSources((s) => ({ ...s, timetable: file.name }));
    setLastSync(new Date());
    pushToast("Timetable replaced", `${parsed.teachers.length} faculty schedules imported and applied.`, "success");
  }, [pushToast]);

  const applyPunchUpload = useCallback(async (file) => {
    if (!tt) { pushToast("Upload a timetable first", "Punch data is verified against the active timetable.", "error"); return; }
    const map = await parsePunchFile(file, tt.teachers);
    setPunchMap(map);
    persistState({ punch: map, punchName: file.name, punchDate: dayKey(new Date()) });
    setSources((s) => ({ ...s, punch: file.name }));
    setLastSync(new Date());
    pushToast("Punch sheet applied", `${Object.keys(map).length} punches matched against today's timetable.`, "success");
  }, [pushToast, tt]);

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
            c={c} clock={clock} lastSync={lastSync} summary={summary} todayRecords={todayRecords} teachers={teachers}
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
                    setWatchConnected={setWatchConnected} sources={sources} teachers={teachers}
                    clearPunchSheet={clearPunchSheet} applyPunchUpload={applyPunchUpload} applyTimetableUpload={applyTimetableUpload} />
                </motion.div>
              )}
              {page === "history" && (
                <motion.div key="hist" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                  <HistoryPage c={c} onOpenTeacher={setDrawerTeacher} pushToast={pushToast} teachers={teachers} refreshKey={historyKey} tt={tt} onRefresh={() => setHistoryKey((k) => k + 1)} />
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

      <TeacherDrawer c={c} teacherId={drawerTeacher} onClose={() => setDrawerTeacher(null)} todayRecords={todayRecords} teachers={teachers} />

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

function TopHeader({ c, clock, lastSync, summary, themeMode, setThemeMode, onMenu, onManualNote, todayRecords, teachers }) {
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
          <div className="text-[12px] leading-tight" style={{ color: c.inkFaint }}>{dateLabel(clock)}</div>
        </div>

        <div className="hidden md:block ml-6 flex-1 max-w-sm">
          <TeacherSearch c={c} todayRecords={todayRecords} teachers={teachers} />
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

function Dashboard({ c, records, summary, onOpenTeacher, pushToast, syncNow, lastSync, watchConnected, setWatchConnected, sources, clearPunchSheet, applyPunchUpload, applyTimetableUpload, teachers }) {
  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <TeacherSearch c={c} todayRecords={records} teachers={teachers} />
      </div>
      <AttendanceTable c={c} records={records} onOpenTeacher={onOpenTeacher} pushToast={pushToast} clearPunchSheet={clearPunchSheet} />
      <SummarySection c={c} summary={summary} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <AttentionPanel c={c} records={records} onOpenTeacher={onOpenTeacher} />
        <UploadCard c={c} pushToast={pushToast} syncNow={syncNow} lastSync={lastSync}
          watchConnected={watchConnected} setWatchConnected={setWatchConnected} sources={sources}
          applyPunchUpload={applyPunchUpload} applyTimetableUpload={applyTimetableUpload} teacherCount={teachers.length} />
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

function UploadCard({ c, pushToast, syncNow, lastSync, watchConnected, setWatchConnected, sources, applyPunchUpload, applyTimetableUpload, teacherCount }) {
  const [refreshing, setRefreshing] = useState(false);
  const ttRef = React.useRef(null);
  const psRef = React.useRef(null);
  const replace = (kind) => async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (kind === "punch") {
      try {
        await applyPunchUpload(f);
      } catch {
        pushToast("Could not read punch sheet", "Expected columns for teacher name and punch time.", "error");
      }
      return;
    }
    try {
      await applyTimetableUpload(f);
    } catch {
      pushToast("Could not read timetable", "Expected faculty blocks with hour columns 1-7.", "error");
    }
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
            <div className="text-[11px] truncate" style={{ color: c.inkFaint }}>{sources.timetable} · {teacherCount} teachers</div>
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
              exportCSV(filtered.map((r) => ({ Teacher: r.name, Department: r.dept, Subject: r.subject, FirstClass: hourLabel(r.hour), Deadline: minToLabel(r.deadline), Punch: minToLabel(r.punch), Status: r.status })), "faculty-flow-today.csv");
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
                {col("firstClass") && <td className="px-4 py-3 whitespace-nowrap ff-mono" style={{ color: c.inkMuted }}>{hourLabel(r.hour)}</td>}
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

function TeacherDrawer({ c, teacherId, onClose, todayRecords, teachers = [] }) {
  const teacher = teachers.find((t) => t.id === teacherId);
  const today = todayRecords.find((r) => r.id === teacherId);
  const history = useMemo(() => (teacherId ? historyRows().filter((r) => r.id === teacherId).sort((a, b) => a.date - b.date).slice(-30) : []), [teacherId]);
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
                  <div><div style={{ color: c.inkFaint }} className="text-[11px]">Subject</div><div className="font-semibold">{today?.subject || "—"}</div></div>
                  <div><div style={{ color: c.inkFaint }} className="text-[11px]">Reporting time</div><div className="font-semibold ff-mono">{today ? minToLabel(today.deadline) : "—"}</div></div>
                  <div><div style={{ color: c.inkFaint }} className="text-[11px]">Punch time</div><div className="font-semibold ff-mono">{today ? minToLabel(today.punch) : "—"}</div></div>
                  <div><div style={{ color: c.inkFaint }} className="text-[11px]">Delay</div><div className="font-semibold ff-mono">{today?.status === "Late" ? `+${today.delay} min` : "—"}</div></div>
                </div>
              </div>

              {stats && (
                <div className="grid grid-cols-4 gap-2.5">
                  <StatMini c={c} label="Attendance" value={`${stats.pct}%`} tone={c.brand} />
                  <StatMini c={c} label="Late (30d)" value={stats.late} tone={STATUS_META.Late.fg} />
                  <StatMini c={c} label="Late this month" value={mStats.late} tone={STATUS_META.Late.fg} />
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

function HistoryPage({ c, onOpenTeacher, pushToast, teachers = [], refreshKey, tt, onRefresh }) {
  const today = new Date();
  const [startDate, setStartDate] = useState(toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [endDate, setEndDate] = useState(toDateInput(today));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pendingPast, setPendingPast] = useState(null);
  const [pendingDate, setPendingDate] = useState("");
  const [confirmFlush, setConfirmFlush] = useState(false);
  const pastInputRef = useRef(null);

  const savePastSheet = useCallback((map, dateStr, fileName) => {
    const d = fromDateInput(dateStr);
    const recs = buildRecords(tt, map, d, 24 * 60);
    if (!recs.length) { pushToast("No matching records", "None of the punches matched the active timetable for that weekday.", "error"); return false; }
    mergeHistoryDay(dateStr, recs);
    onRefresh?.();
    pushToast("Past sheet saved", `${recs.length} records for ${d.toLocaleDateString("en-IN")} added to History from ${fileName}.`, "success");
    return true;
  }, [tt, pushToast, onRefresh]);

  const handlePastUpload = useCallback(async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!tt) { pushToast("Upload a timetable first", "Past punches are verified against the active timetable.", "error"); return; }
    try {
      const { map, date } = await parsePastPunchFile(f, tt.teachers);
      if (!Object.keys(map).length) { pushToast("No punches matched", "No teacher names from the file matched the active timetable.", "error"); return; }
      if (date) { savePastSheet(map, dayKey(date), f.name); return; }
      setPendingPast({ map, name: f.name });
      setPendingDate("");
    } catch {
      pushToast("Could not read punch sheet", "Expected columns for teacher name and punch time.", "error");
    }
  }, [tt, pushToast, savePastSheet]);

  const confirmPendingDate = useCallback(() => {
    if (!pendingPast || !pendingDate) return;
    if (savePastSheet(pendingPast.map, pendingDate, pendingPast.name)) setPendingPast(null);
  }, [pendingPast, pendingDate, savePastSheet]);

  const flushHistory = useCallback(() => {
    writeHistoryStore({});
    setConfirmFlush(false);
    onRefresh?.();
    pushToast("History deleted", "All past records removed. Today's view is untouched.", "info");
  }, [pushToast, onRefresh]);

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
        <div className="flex flex-wrap gap-2">
          <button onClick={async () => { await exportXLSX(exportRows(), `${fileBase}.xlsx`, "History"); pushToast("Excel exported", `${scopeLabel} · ${rangeLabel}`, "success"); }}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-[12.5px] font-semibold" style={{ background: c.brand, color: "#fff" }}>
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button onClick={async () => { await exportPDF(exportRows(), `${fileBase}.pdf`, `${scopeLabel} · ${rangeLabel}`); pushToast("PDF exported", `${scopeLabel} · ${rangeLabel}`, "success"); }}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-[12.5px] font-semibold" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.inkMuted }}>
            <Download size={13} /> PDF
          </button>
          <input ref={pastInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handlePastUpload} />
          <button onClick={() => pastInputRef.current?.click()}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-[12.5px] font-semibold" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.inkMuted }}>
            <CalendarPlus size={13} /> Upload past sheet
          </button>
          <button onClick={() => setConfirmFlush(true)}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-[12.5px] font-semibold" style={{ background: STATUS_META.Absent.bg, border: `1px solid ${STATUS_META.Absent.fg}44`, color: STATUS_META.Absent.fg }}>
            <Trash2 size={13} /> Flush all history
          </button>
        </div>
      </div>

      {pendingPast && (
        <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-end gap-3" style={{ background: c.surface, border: `1px solid ${c.brand}55` }}>
          <div className="flex-1">
            <div className="text-[13px] font-bold">No date found in "{pendingPast.name}"</div>
            <div className="text-[12px] mt-0.5" style={{ color: c.inkMuted }}>Pick the date this punch sheet belongs to. {Object.keys(pendingPast.map).length} punches matched the active timetable.</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: c.inkFaint }}>Sheet date</div>
            <input type="date" value={pendingDate} max={toDateInput(new Date())} onChange={(e) => setPendingDate(e.target.value)}
              className="h-9 px-2.5 rounded-lg text-[12.5px] outline-none" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.ink }} />
          </div>
          <div className="flex gap-2">
            <button onClick={confirmPendingDate} disabled={!pendingDate}
              className="h-9 px-3 rounded-lg text-[12.5px] font-semibold disabled:opacity-50" style={{ background: c.brand, color: "#fff" }}>Save to history</button>
            <button onClick={() => setPendingPast(null)}
              className="h-9 px-3 rounded-lg text-[12.5px] font-semibold" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.inkMuted }}>Cancel</button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {confirmFlush && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setConfirmFlush(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl p-5 max-w-sm w-full" style={{ background: c.surface, border: `1px solid ${c.border}` }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="h-9 w-9 rounded-xl inline-flex items-center justify-center" style={{ background: STATUS_META.Absent.bg, color: STATUS_META.Absent.fg }}><Trash2 size={16} /></span>
                <h3 className="text-[15px] font-bold">Delete all history?</h3>
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: c.inkMuted }}>
                Are you sure you want to permanently delete all historical attendance records? This action cannot be undone. Today's active view will not be affected.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setConfirmFlush(false)}
                  className="h-9 px-3 rounded-lg text-[12.5px] font-semibold" style={{ background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.inkMuted }}>Cancel</button>
                <button onClick={flushHistory}
                  className="h-9 px-3 rounded-lg text-[12.5px] font-semibold" style={{ background: STATUS_META.Absent.fg, color: "#fff" }}>Delete permanently</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
