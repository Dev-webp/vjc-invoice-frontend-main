import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";

const API = "https://vjc-invoice-backend-git-team-monitor-abc.vercel.app/api"; // TEMP: preview test only
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("vjc_invoice_auth")}`,
});
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("vjc_invoice_user")) || {};
  } catch {
    return {};
  }
};

const RANGES = [
  { key: "today", label: "Today", text: "today" },
  { key: "yesterday", label: "Yesterday", text: "yesterday" },
  { key: "7d", label: "Last 7 days", text: "in the last 7 days" },
];

const AVATARS = [
  ["#e8f1fc", "#164A87"], ["#fbeaf0", "#72243E"], ["#fff1d9", "#8a5200"],
  ["#e4f4ec", "#085041"], ["#eeedfe", "#3C3489"], ["#e2e7ee", "#5d6b7a"],
];

const C = {
  navy: "#164A87", org: "#F5820C", teal: "#0F9D8F", tealBg: "#e6f3f2",
  red: "#C73535", redBg: "#fdeaea", amb: "#9A5B00", ambBg: "#fff1d9",
  grn: "#17794F", grnBg: "#e4f4ec", blu: "#2a78d6", bluBg: "#e8f1fc",
  tx2: "#5d6b7a", bd: "#e2e7ee", sf2: "#f4f6f9",
};

const initials = (n = "") => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const diff = (cur = 0, prev = 0) => cur - prev;
const slaColor = (m) => (m <= 5 ? C.red : m <= 15 ? "#EF9F27" : C.grn);

const cardSx = { bgcolor: C.sf2, borderRadius: "10px", p: "18px 20px", minWidth: 0 };
const headSx = { fontSize: 14, fontWeight: 500, mb: 1.5, display: "flex", alignItems: "baseline", gap: 1.25 };
const subSx = { fontSize: 12, fontWeight: 400, color: C.tx2 };

function Bar({ value, color }) {
  return (
    <Box sx={{ height: 5, borderRadius: 3, bgcolor: C.bd, overflow: "hidden", flex: 1 }}>
      <Box sx={{ height: "100%", width: `${Math.min(100, Math.max(0, value))}%`, bgcolor: color, borderRadius: 3 }} />
    </Box>
  );
}

function Chip2({ color, children, onClick }) {
  const bg = color === C.red ? C.redBg : "#fff";
  return (
    <Box
      onClick={onClick}
      sx={{
        fontSize: 12, borderRadius: "6px", px: 1.1, py: 0.5, bgcolor: bg,
        color: color === C.red ? C.red : "inherit", display: "flex", gap: 0.75,
        alignItems: "center", whiteSpace: "nowrap", cursor: onClick ? "pointer" : "default",
      }}
    >
      <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: color, flex: "none" }} />
      {children}
    </Box>
  );
}

function Btn({ primary, children, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "inline-flex", alignItems: "center", height: 30, px: 1.75, fontSize: 12,
        borderRadius: "6px", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
        bgcolor: primary ? C.org : "#fff", color: primary ? "#fff" : "inherit",
        fontWeight: primary ? 500 : 400,
      }}
    >
      {children}
    </Box>
  );
}

function AlertRow({ tag, amber, title, text, children }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) auto" }, columnGap: 2.5, rowGap: 0.5, alignItems: "center", py: 1.5, borderTop: `1px solid ${C.bd}`, "&:first-of-type": { borderTop: "none", pt: 0 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flexWrap: "wrap" }}>
        <Box component="span" sx={{ width: 74, textAlign: "center", fontSize: 11, fontWeight: 500, borderRadius: "10px", py: "1px", flex: "none", bgcolor: amber ? C.ambBg : C.redBg, color: amber ? C.amb : C.red }}>{tag}</Box>
        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{title}</Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1, gridRow: { xl: "1 / span 2" }, gridColumn: { xl: 2 }, mt: { xs: 0.5, xl: 0 } }}>{children}</Box>
      <Typography sx={{ fontSize: 12, color: C.tx2, pl: { xl: "86px" } }}>{text}</Typography>
    </Box>
  );
}

function TeamMonitorTab({ onGoPending }) {
  const [range, setRange] = useState("today");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async (showSpinner) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch(`${API}/leads/team-monitor?range=${range}`, { headers: authHeader() });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to load");
      setData(json);
      setUpdatedAt(new Date());
      setError("");
    } catch (e) {
      setError(e.message || "Failed to load team monitor");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load(true);
    const t = setInterval(() => load(false), 30000);
    return () => clearInterval(t);
  }, [load]);

  const openLead = (id) => window.open(`/lead-history/${id}`, "_blank");

  if (loading && !data) {
    return <Box sx={{ p: 6, textAlign: "center" }}><CircularProgress /></Box>;
  }

  const s = data?.summary || {};
  const prev = data?.previous || {};
  const agents = data?.agents || [];
  const flagFeed = data?.red_flag_feed || [];
  const openLeads = data?.open_leads || [];
  const rangeText = RANGES.find((r) => r.key === range)?.text || "today";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const slaMet = pct(s.contacted || 0, s.assigned || 0);
  const atRisk = openLeads.filter((l) => l.minutes_left <= 10).slice(0, 2);
    const agentName = (id) => agents.find((a) => a.id === id)?.name || "agent";
  const self = data?.scope === "self";
  const me = getCurrentUser();
  const who = me.role === "chairman" ? "Chairman" : (me.name || "");

  const funnel = [
        { l: self ? "My leads" : "Received", n: s.received, p: "100%", w: 100, k: "received", col: C.blu },
    { l: "Assigned", n: s.assigned, p: `${pct(s.assigned, s.received)}% of received`, w: pct(s.assigned, s.received), k: "assigned", col: C.blu },
    { l: "Contacted", n: s.contacted, p: `${pct(s.contacted, s.assigned)}% of assigned`, w: pct(s.contacted, s.received), k: "contacted", col: C.blu },
    { l: "Warm or Prospect", n: s.warm_prospect, p: `${pct(s.warm_prospect, s.contacted)}% of contacted`, w: pct(s.warm_prospect, s.received), k: "warm_prospect", col: C.blu },
    { l: "Pending agreement", n: s.pending_agreement, p: "Needs follow up", w: pct(s.pending_agreement, s.received), k: "pending_agreement", col: "#EF9F27", tone: "a" },
    { l: "Closed", n: s.closed, p: `${pct(s.closed, s.received)}% of received`, w: pct(s.closed, s.received), k: "closed", col: C.grn, tone: "g" },
    ].filter((f) => !(self && f.k === "assigned"));

  const hourMap = Object.fromEntries((data?.by_hour || []).map((h) => [h.hour, h.count]));
  const hours = Array.from({ length: 10 }, (_, i) => ({ h: i + 9, c: hourMap[i + 9] || 0 }));
  const maxHour = Math.max(1, ...hours.map((x) => x.c));
  const maxSource = Math.max(1, ...(data?.by_source || []).map((x) => x.count));
  const cellColor = (v) => (v >= 8 ? [C.blu, "#fff"] : v >= 4 ? ["#7fb0ea", "#0c2c52"] : v >= 2 ? ["#bcd6f5", "#0c2c52"] : [C.bluBg, "inherit"]);

  const cols = "26% 30% 8% 11% 10% 15%";

  return (
    <Box>
      {/* teal breadcrumb bar, same look as the other tabs */}
      <Box sx={{ bgcolor: C.teal, color: "#fff", borderRadius: "10px 10px 0 0", height: 52, px: 3.25, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
        <span>Lead » Team Monitor</span>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 13 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#9ff0c9" }} />
          Live, refreshes every 30 sec{updatedAt ? ` · ${updatedAt.toLocaleTimeString()}` : ""}
        </Box>
      </Box>

      <Box sx={{ bgcolor: "#fff", borderRadius: "0 0 10px 10px", p: "24px 26px 28px" }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Chairman summary banner */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, bgcolor: C.navy, color: "#fff", borderRadius: "12px", p: "18px 24px", mb: 2.75, flexWrap: "wrap" }}>
          <Box>
                       <Typography sx={{ fontSize: 18, fontWeight: 500, mb: 0.5 }}>{greet}{who ? `, ${who}` : ""}</Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.9 }}>
              {self
                ? `${s.received || 0} leads are assigned to you ${rangeText}, and you have ${s.red_flags || 0} red flags.`
                : `${s.received || 0} leads came in ${rangeText}. ${s.pending_assignment || 0} are waiting for an agent and ${s.red_flags || 0} red flags need your attention.`}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 4, ml: "auto" }}>
                        {(self
              ? [[`${slaMet}%`, "contacted"], [`${s.red_flags || 0}`, "red flags"], [agents[0]?.avg_reply_min != null ? `${agents[0].avg_reply_min} min` : "-", "avg reply"]]
              : [[`${pct(s.assigned, s.received)}%`, "assigned"], [`${slaMet}%`, "contacted"], [`${s.agents_online || 0} / ${s.agents_total || 0}`, "agents online"]]
            ).map(([v, l]) => (
              <Box key={l} sx={{ textAlign: "right" }}>
                <Typography sx={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2 }}>{v}</Typography>
                <Typography sx={{ fontSize: 11, opacity: 0.8 }}>{l}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Filter bar */}
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 2.5 }}>
          <Box sx={{ display: "flex", bgcolor: C.sf2, borderRadius: "8px", p: "3px", height: 38 }}>
            {RANGES.map((r) => (
              <Box key={r.key} onClick={() => setRange(r.key)} sx={{ display: "flex", alignItems: "center", px: 2, borderRadius: "6px", fontSize: 13, cursor: "pointer", userSelect: "none", bgcolor: range === r.key ? C.navy : "transparent", color: range === r.key ? "#fff" : C.tx2 }}>
                {r.label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Pipeline */}
        <Typography sx={headSx}>Lead pipeline<span style={{ ...subSx }}>Where the {s.received || 0} leads stand right now, change shown against the previous period</span></Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(3,1fr)", lg: `repeat(${funnel.length},1fr)` }, gap: 1.5, mb: 2.75 }}>
          {funnel.map((f) => {
            const d = diff(s[f.k], prev[f.k]);
            const tone = f.tone === "a" ? [C.ambBg, C.amb] : f.tone === "g" ? [C.grnBg, C.grn] : [C.sf2, null];
            return (
              <Box key={f.l} sx={{ bgcolor: tone[0], borderRadius: "10px", p: "14px 16px 12px", display: "flex", flexDirection: "column", gap: 0.25 }}>
                <Typography sx={{ fontSize: 12, color: tone[1] || C.tx2, minHeight: 34 }}>{f.l}</Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1, color: tone[1] || "inherit" }}>{f.n || 0}</Typography>
                  <Box component="span" sx={{ fontSize: 12, fontWeight: 500, ml: 1, px: 1, borderRadius: "10px", bgcolor: d >= 0 ? C.grnBg : C.redBg, color: d >= 0 ? C.grn : C.red }}>
                    {d >= 0 ? `+${d}` : d}
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 12, color: tone[1] || C.tx2, mb: 1 }}>{f.p}</Typography>
                <Box sx={{ mt: "auto", display: "flex" }}><Bar value={f.w} color={f.col} /></Box>
              </Box>
            );
          })}
        </Box>

        {/* Agent board + attention panel */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2, mb: 2, alignItems: "stretch" }}>
          <Box sx={cardSx}>
            <Typography sx={headSx}>
                            {self ? "My workload" : "Agent workload board"}<span style={subSx}>Open leads run on a 30 min SLA clock</span>
              <Box component="span" sx={{ ml: "auto", display: "flex", gap: 1.75, fontSize: 11, color: C.tx2 }}>
                {[["On track", C.grn], ["Under 15 min", "#EF9F27"], ["Under 5 min", C.red]].map(([t, c]) => (
                  <Box key={t} component="span" sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: c }} />{t}
                  </Box>
                ))}
              </Box>
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 720 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: cols, fontSize: 12, color: C.tx2, pb: 1.25 }}>
                  <Box sx={{ px: 1 }}>Agent</Box><Box sx={{ px: 1 }}>Open leads and time left</Box>
                  <Box sx={{ px: 1, textAlign: "center" }}>Leads</Box><Box sx={{ px: 1, textAlign: "center" }}>Avg reply</Box>
                  <Box sx={{ px: 1, textAlign: "center" }}>Flags</Box><Box sx={{ px: 1 }}>SLA met</Box>
                </Box>
                {agents.length === 0 && <Typography sx={{ py: 2, color: C.tx2, fontSize: 13 }}>No department staff found.</Typography>}
                {agents.map((a, i) => {
                  const [abg, afg] = AVATARS[i % AVATARS.length];
                  const skipped = a.flags >= 3;
                  const dot = skipped ? C.red : a.in_meeting ? "#EF9F27" : a.is_online ? "#1b8a5a" : "#888";
                  const sub = `${a.department || "No department"}${skipped ? ", skipped today" : a.in_meeting ? ", in meeting" : !a.is_online ? ", offline" : ""}`;
                  const sla = a.sla_met_pct;
                  return (
                    <Box key={a.id} sx={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", borderTop: `1px solid ${C.bd}`, py: 1.5 }}>
                      <Box sx={{ px: 1, display: "flex", gap: 1.25, alignItems: "center", minWidth: 0 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: skipped ? C.redBg : abg, color: skipped ? C.red : afg, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, position: "relative", flex: "none" }}>
                          {initials(a.name)}
                          <Box sx={{ position: "absolute", right: -2, bottom: -2, width: 11, height: 11, borderRadius: "50%", bgcolor: dot, border: `2px solid ${C.sf2}` }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 500, lineHeight: 1.2, fontSize: 14 }} noWrap>{a.name}</Typography>
                          <Typography sx={{ fontSize: 12, color: C.tx2 }} noWrap>{sub}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ px: 1, display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                        {a.open_leads.slice(0, 3).map((l) => (
                          <Chip2 key={l.lead_id} color={slaColor(l.minutes_left)} onClick={() => openLead(l.lead_id)}>
                            {l.lead_name} {Math.max(0, l.minutes_left)}m
                          </Chip2>
                        ))}
                        {a.open_leads.length === 0 && (skipped
                          ? <Chip2 color={C.red}>3 flags, no new leads</Chip2>
                          : <Chip2 color="#c5ccd6">No open leads</Chip2>)}
                      </Box>
                      <Box sx={{ px: 1, textAlign: "center", fontWeight: 500 }}>{a.leads}</Box>
                      <Box sx={{ px: 1, textAlign: "center" }}>{a.avg_reply_min != null ? `${a.avg_reply_min} min` : "-"}</Box>
                      <Box sx={{ px: 1, display: "flex", gap: "3px", justifyContent: "center" }}>
                        {[0, 1, 2].map((k) => <Box key={k} sx={{ width: 12, height: 6, borderRadius: "2px", bgcolor: k < a.flags ? C.red : C.bd }} />)}
                      </Box>
                      <Box sx={{ px: 1, display: "flex", gap: 1, alignItems: "center" }}>
                        <Bar value={sla ?? 0} color={sla == null ? C.bd : sla >= 85 ? C.grn : sla >= 60 ? "#EF9F27" : C.red} />
                        <Box sx={{ fontSize: 12, fontWeight: 500, width: 34, textAlign: "right" }}>{sla == null ? "-" : `${sla}%`}</Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>

          <Box sx={{ ...cardSx, display: "flex", flexDirection: "column" }}>
            <Typography sx={headSx}>
              Needs your attention
              <Box component="span" sx={{ ml: "auto", bgcolor: C.redBg, color: C.red, fontWeight: 500, borderRadius: "10px", px: 1.25, py: "2px", fontSize: 12 }}>{s.red_flags || 0} red flags</Box>
            </Typography>
            {flagFeed.length === 0 && atRisk.length === 0 && <Typography sx={{ fontSize: 13, color: C.tx2, py: 1 }}>No alerts right now.</Typography>}
            {flagFeed.slice(0, 3).map((f) => (
              <AlertRow key={`f${f.id}`} tag="Red flag" title={`${f.agent_name} missed ${f.lead_name || "a lead"}`}
                text={f.now_with ? `Moved to ${f.now_with}, clock restarted.` : "No agent available. Now in Pending Assignment."}>
                {f.lead_id && <Btn primary onClick={() => openLead(f.lead_id)}>Open lead</Btn>}
               {!f.now_with && onGoPending && <Btn onClick={onGoPending}>Assign now</Btn>}
              </AlertRow>
            ))}
            {atRisk.map((l) => (
              <AlertRow key={`r${l.lead_id}`} tag="At risk" amber title={`${l.lead_name} with ${agentName(l.assigned_to)}`}
                text={`${Math.max(0, l.minutes_left)} min left and no note added yet.`}>
                <Btn primary onClick={() => openLead(l.lead_id)}>Open lead</Btn>
              </AlertRow>
            ))}
<Box sx={{ mt: "auto", pt: 1.75, display: self ? "none" : "block" }}>
                  <Box sx={{ bgcolor: C.ambBg, color: C.amb, borderRadius: "10px", px: 2.25, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ lineHeight: 1.35 }}>
                  <Box component="span" sx={{ fontSize: 22, fontWeight: 500, mr: 0.75 }}>{s.pending_assignment || 0}</Box>leads waiting for an agent
                  <Box sx={{ fontSize: 12 }}>Oldest has waited {data?.pending?.oldest_min || 0} min</Box>
                </Box>
                <Btn primary onClick={onGoPending}>Assign leads</Btn>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom three cards */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3,1fr)" }, gap: 2, alignItems: "stretch" }}>
          <Box sx={cardSx}>
            <Typography sx={headSx}>Department by lead status</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "118px repeat(5,minmax(0,1fr))", gap: "4px", fontSize: 12 }}>
              <Box />{["New", "Warm", "Prospect", "Closed", "Dead"].map((h) => <Box key={h} sx={{ textAlign: "center", color: C.tx2, fontSize: 11, pb: 0.5 }}>{h}</Box>)}
              {(data?.by_department || []).map((d) => (
                <Box key={d.department} sx={{ display: "contents" }}>
                  <Box sx={{ display: "flex", alignItems: "center", height: 32 }}><Typography noWrap sx={{ fontSize: 12 }}>{d.department}</Typography></Box>
                  {[d.new_leads, d.warm, d.prospect, d.closed, d.dead].map((v, i) => {
                    const [bg, fg] = cellColor(v);
                    return <Box key={i} sx={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", bgcolor: bg, color: fg }}>{v}</Box>;
                  })}
                </Box>
              ))}
            </Box>
            {(data?.by_department || []).length === 0 && <Typography sx={{ fontSize: 13, color: C.tx2 }}>No leads in this period.</Typography>}
          </Box>

          <Box sx={cardSx}>
            <Typography sx={headSx}>Source quality<span style={subSx}>leads received</span></Typography>
            {(data?.by_source || []).map((x) => (
              <Box key={x.source} sx={{ display: "grid", gridTemplateColumns: "88px minmax(0,1fr) 30px", gap: 1.25, alignItems: "center", fontSize: 12, height: 34 }}>
                <Typography noWrap sx={{ fontSize: 12 }}>{x.source}</Typography>
                <Bar value={pct(x.count, maxSource)} color={C.blu} />
                <Box sx={{ textAlign: "right", fontWeight: 500 }}>{x.count}</Box>
              </Box>
            ))}
            {(data?.by_source || []).length === 0 && <Typography sx={{ fontSize: 13, color: C.tx2 }}>No leads in this period.</Typography>}
          </Box>

          <Box sx={cardSx}>
            <Typography sx={headSx}>Leads by hour</Typography>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.75, height: 120 }}>
              {hours.map((x) => (
                <Box key={x.h} title={`${x.h}:00 - ${x.c} leads`} sx={{ flex: 1, height: `${Math.max(3, pct(x.c, maxHour))}%`, bgcolor: x.c === maxHour && x.c > 0 ? C.navy : C.blu, borderRadius: "3px 3px 0 0" }} />
              ))}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.tx2, mt: 1 }}>
              <span>9 am</span><span>12 pm</span><span>3 pm</span><span>6 pm</span>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default TeamMonitorTab;