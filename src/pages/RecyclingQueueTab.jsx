// NEW FILE (v3) — Recycling Queue + Rules tab (already wired into Leads.jsx: 1 import + 1 Tab + 1 render line)
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, CircularProgress, Alert, Stack, Menu, MenuItem, Checkbox, TextField,
  Select, FormControl, InputLabel, ToggleButtonGroup, ToggleButton,
} from "@mui/material";

const API = import.meta.env.VITE_API_URL || "https://invoice.vjcoverseas.com/api";
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("vjc_invoice_auth")}` });
const jsonHeaders = () => ({ "Content-Type": "application/json", ...authHeader() });

const STATE_STYLE = {
  eligible:  { bg: "#e6f4ea", fg: "#1b6e35", border: "#9fd3ae", label: "ELIGIBLE" },
  hold:      { bg: "#fff4e0", fg: "#9a5b00", border: "#f2c880", label: "HOLD" },
  cooling:   { bg: "#e8f0fe", fg: "#1a4fa3", border: "#a9c3f2", label: "COOLING" },
  exception: { bg: "#fdecea", fg: "#b3261e", border: "#f3a9a3", label: "EXCEPTION" },
  reminder:  { bg: "#f3e8fd", fg: "#6a1b9a", border: "#d3b0ee", label: "REMINDER" },
};
const STATUS_STYLE = {
  Warm: { bg: "#f6d9a7", fg: "#6b4300" },
  Cold: { bg: "#dbeafe", fg: "#1e3a8a" },
  Dead: { bg: "#d9d9d9", fg: "#333333" },
};
const OWNER_STYLE = {
  "Auto-Recycle Pending": "#1b6e35",
  "Manual Exception Review": "#b3261e",
  "Cooling Period": "#1a4fa3",
  "Recycled/Reassigned": "#6a1b9a",
  Closed: "#555555",
  Assigned: "#0b3471",
};
const SUPPRESS_REASONS = [
  ["converted", "Converted"],
  ["disqualified", "Disqualified"],
  ["do_not_contact", "Do Not Contact"],
  ["invalid_contact", "Invalid Contact"],
  ["duplicate", "Duplicate"],
  ["legal_consent", "Legal / Consent Restriction"],
];
const DEAD_REASONS = [
  ["not_reachable", "Not Reachable"],
  ["budget", "Budget"],
  ["timing", "Timing"],
];

const GRID = "1px solid #d5dbe5";
const cell = { border: GRID, py: 1, px: 1.2, fontSize: 13, verticalAlign: "middle" };
const head = {
  border: "1px solid #0b3471", bgcolor: "#0b3471", color: "#fff", fontWeight: 700,
  fontSize: 12.5, py: 1.1, px: 1.2, whiteSpace: "nowrap",
};

// ───────────────────────── Rules (trigger matrix) ─────────────────────────
function RulesPanel({ canEdit }) {
  const [data, setData] = useState(null);
  const [scope, setScope] = useState("global");
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API}/recycle/rules`, { headers: authHeader() }).then((x) => x.json());
      if (!r.success) throw new Error(r.message || "Failed to load rules");
      setData(r);
      setEdits({});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const depId = scope === "global" ? null : Number(scope);
  const find = (dep, key) => data?.rules.find((x) => (x.department_id || null) === dep && x.trigger_key === key);
  const effective = (key) => {
    const own = depId ? find(depId, key) : null;
    const glob = find(null, key);
    const src = own || glob || data.defaults[key];
    return { enabled: src.enabled, value: src.value, overridden: depId ? !!own : !!glob };
  };

  const save = async (key) => {
    const cur = effective(key);
    const e = edits[key] || {};
    setSaving(key);
    try {
      const res = await fetch(`${API}/recycle/rules`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify({
          department_id: depId,
          trigger_key: key,
          enabled: e.enabled ?? cur.enabled,
          value: e.value ?? cur.value,
        }),
      }).then((x) => x.json());
      if (!res.success) alert("❌ " + (res.message || "Failed"));
    } catch { alert("❌ Request failed"); }
    setSaving("");
    load();
  };
  const reset = async (key) => {
    if (!window.confirm("Remove this override and go back to the inherited / default value?")) return;
    setSaving(key);
    try {
      await fetch(`${API}/recycle/rules/reset`, {
        method: "POST", headers: jsonHeaders(), body: JSON.stringify({ department_id: depId, trigger_key: key }),
      });
    } catch { alert("❌ Request failed"); }
    setSaving("");
    load();
  };

  if (loading) return <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={28} /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        All timeframes are <b>calendar days</b> and are suggested defaults, not approved policy. Set them globally or per department
        (service/team) and switch each trigger on / off. Business-hours timing applies only to the first-action SLA (existing).
        Reminder triggers are <b>OFF</b> by default.
      </Alert>
      <FormControl size="small" sx={{ minWidth: 260, mb: 2 }}>
        <InputLabel>Apply to</InputLabel>
        <Select label="Apply to" value={scope} onChange={(e) => { setScope(e.target.value); setEdits({}); }}>
          <MenuItem value="global">All departments (global default)</MenuItem>
          {data.departments.map((d) => <MenuItem key={d.id} value={String(d.id)}>{d.name} (override)</MenuItem>)}
        </Select>
      </FormControl>
      <TableContainer component={Paper} sx={{ border: GRID, borderRadius: 1 }}>
        <Table size="small" sx={{ borderCollapse: "collapse", minWidth: 860 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={head}>Trigger</TableCell>
              <TableCell sx={head} align="center">On</TableCell>
              <TableCell sx={head} align="center">Value</TableCell>
              <TableCell sx={head}>Unit</TableCell>
              <TableCell sx={head}>Source</TableCell>
              {canEdit && <TableCell sx={head} align="center">Action</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.triggers.map((t, i) => {
              const cur = effective(t.key);
              const e = edits[t.key] || {};
              const enabled = e.enabled ?? cur.enabled;
              const value = e.value ?? cur.value;
              const dirty = e.enabled !== undefined || e.value !== undefined;
              const noValue = t.key === "dead_budget_timing";
              return (
                <TableRow key={t.key} sx={{ bgcolor: i % 2 ? "#f7f9fc" : "#fff" }}>
                  <TableCell sx={{ ...cell, fontWeight: 600 }}>{t.label}</TableCell>
                  <TableCell sx={cell} align="center">
                    <Checkbox size="small" checked={!!enabled} disabled={!canEdit}
                      onChange={(ev) => setEdits({ ...edits, [t.key]: { ...e, enabled: ev.target.checked } })} />
                  </TableCell>
                  <TableCell sx={cell} align="center">
                    {noValue ? "—" : (
                      <TextField size="small" type="number" value={value} disabled={!canEdit}
                        inputProps={{ min: 0, max: 3650, style: { width: 70, textAlign: "center" } }}
                        onChange={(ev) => setEdits({ ...edits, [t.key]: { ...e, value: ev.target.value } })} />
                    )}
                  </TableCell>
                  <TableCell sx={cell}>{t.unit}</TableCell>
                  <TableCell sx={cell}>
                    {cur.overridden ? <b>{depId ? "Department override" : "Global (custom)"}</b> : depId ? "Inherited" : "Built-in default"}
                  </TableCell>
                  {canEdit && (
                    <TableCell sx={cell} align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button size="small" variant="contained" disabled={!dirty || saving === t.key}
                          onClick={() => save(t.key)} sx={{ textTransform: "none" }}>Save</Button>
                        {cur.overridden && (
                          <Button size="small" variant="outlined" disabled={saving === t.key}
                            onClick={() => reset(t.key)} sx={{ textTransform: "none" }}>Reset</Button>
                        )}
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {!canEdit && <Typography variant="caption" color="text.secondary">View only. Only the chairman can change rules.</Typography>}
    </Box>
  );
}

// ───────────────────────── Queue ─────────────────────────
export default function RecyclingQueueTab({ canAct }) {
  const [view, setView] = useState("queue");
  const [items, setItems] = useState([]);
  const [suppressed, setSuppressed] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [menu, setMenu] = useState({ anchor: null, leadId: null, type: null });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [q, s] = await Promise.all([
        fetch(`${API}/recycle/queue`, { headers: authHeader() }).then((r) => r.json()),
        fetch(`${API}/recycle/suppressed`, { headers: authHeader() }).then((r) => r.json()),
      ]);
      if (!q.success) throw new Error(q.message || "Failed to load queue");
      setItems(q.items || []);
      setCfg(q.config || null);
      setDepartments(q.departments || []);
      setSuppressed(s.success ? s.items || [] : []);
    } catch (e) {
      setError(e.message || "Failed to load recycling queue");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = { all: items.length, eligible: 0, hold: 0, cooling: 0, exception: 0, reminder: 0, suppressed: suppressed.length };
    items.forEach((i) => { if (c[i.state] !== undefined) c[i.state] += 1; });
    return c;
  }, [items, suppressed]);

  const shown = filter === "all" ? items : items.filter((i) => i.state === filter);

  const act = async (id, url, method, body) => {
    setBusyId(id);
    try {
      const res = await fetch(`${API}/recycle/${id}/${url}`, {
        method, headers: jsonHeaders(), body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.success) alert("❌ " + (data.message || "Failed"));
    } catch {
      alert("❌ Request failed");
    }
    setBusyId(null);
    load();
  };

  const closeMenu = () => setMenu({ anchor: null, leadId: null, type: null });
  const askDate = (msg) => {
    const d = window.prompt(msg, "");
    if (d === null) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.trim())) { alert("Please enter the date as YYYY-MM-DD"); return null; }
    return d.trim();
  };

  const pick = (value, label) => {
    const { leadId, type } = menu;
    closeMenu();
    if (!leadId) return;
    if (type === "suppress") {
      if (!window.confirm(`Mark this lead as "${label}"?\nIt will be removed from automatic recycling.`)) return;
      const note = window.prompt("Optional note (why?)", "") || "";
      act(leadId, "suppress", "PUT", { reason: value, note });
    } else if (type === "hold") {
      if (value === "date") {
        const d = askDate("Hold until which date? (YYYY-MM-DD) — e.g. intake date, visa window, customer date");
        if (d) act(leadId, "hold", "PUT", { until: d });
      } else act(leadId, "hold", "PUT", { days: value });
    } else if (type === "dead") {
      let date;
      if (value !== "not_reachable") {
        date = askDate(`${label}: customer follow-up date? (YYYY-MM-DD)`);
        if (!date) return;
      }
      act(leadId, "dead-reason", "PUT", { reason: value, date });
    } else if (type === "dept") {
      if (!window.confirm(`Set department to "${label}" for this lead?`)) return;
      act(leadId, "department", "PUT", { department_id: value });
    }
  };

  const menuItems = () => {
    if (menu.type === "suppress") return SUPPRESS_REASONS.map(([k, l]) => [k, l]);
    if (menu.type === "dead") return DEAD_REASONS.map(([k, l]) => [k, l]);
    if (menu.type === "dept") return departments.map((d) => [d.id, d.name]);
    if (menu.type === "hold") return [[7, "Hold 7 days"], [30, "Hold 30 days"], ["date", "Hold until date…"]];
    return [];
  };

  const FilterChip = ({ k, label }) => (
    <Chip
      clickable
      onClick={() => setFilter(k)}
      label={`${label} (${counts[k] ?? 0})`}
      sx={{
        fontWeight: 600, border: "1px solid #0b3471",
        bgcolor: filter === k ? "#0b3471" : "#fff",
        color: filter === k ? "#fff" : "#0b3471",
        "&:hover": { bgcolor: filter === k ? "#0b3471" : "#eef3fb" },
      }}
    />
  );

  const showingSuppressed = filter === "suppressed";

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" rowGap={1}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6" fontWeight="bold">Recycling Queue</Typography>
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="queue" sx={{ textTransform: "none", px: 2 }}>Queue</ToggleButton>
            <ToggleButton value="rules" sx={{ textTransform: "none", px: 2 }}>Rules</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        {view === "queue" && <Button size="small" variant="outlined" onClick={load} sx={{ textTransform: "none" }}>Refresh</Button>}
      </Stack>

      {view === "rules" ? (
        <RulesPanel canEdit={canAct} />
      ) : (
        <>
          {cfg && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Max cycles {cfg.maxCycles} · Cooling {cfg.coolingDays}d after each recycle. Timeframes per trigger are in the Rules tab (calendar days).
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            Total age = since lead created · No-activity = since last note / follow-up / assignment (status edits don’t count) ·
            In status = since status last changed · Since assigned = with current consultant.
            Suppressed leads (Converted, Disqualified, Do Not Contact, Invalid, Duplicate, Legal) are never recycled.
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}>
            <FilterChip k="all" label="All" />
            <FilterChip k="eligible" label="Eligible" />
            <FilterChip k="reminder" label="Reminder" />
            <FilterChip k="hold" label="Hold" />
            <FilterChip k="cooling" label="Cooling" />
            <FilterChip k="exception" label="Exception" />
            <FilterChip k="suppressed" label="Suppressed" />
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={28} /></Box>
          ) : showingSuppressed ? (
            suppressed.length === 0 ? (
              <Alert severity="info">No suppressed leads.</Alert>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: "68vh", border: GRID, borderRadius: 1 }}>
                <Table size="small" stickyHeader sx={{ borderCollapse: "collapse", minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...head, width: 48 }} align="center">#</TableCell>
                      <TableCell sx={head}>Lead</TableCell>
                      <TableCell sx={head}>Mobile</TableCell>
                      <TableCell sx={head} align="center">Status</TableCell>
                      <TableCell sx={head}>Consultant</TableCell>
                      <TableCell sx={head}>Suppressed as</TableCell>
                      <TableCell sx={head}>Note</TableCell>
                      {canAct && <TableCell sx={head} align="center">Action</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {suppressed.map((l, idx) => (
                      <TableRow key={l.id} hover sx={{ bgcolor: idx % 2 ? "#f7f9fc" : "#fff" }}>
                        <TableCell sx={cell} align="center">{idx + 1}</TableCell>
                        <TableCell sx={{ ...cell, fontWeight: 600 }}>{l.lead_name}</TableCell>
                        <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>{l.contact_number}</TableCell>
                        <TableCell sx={cell} align="center">{l.status}</TableCell>
                        <TableCell sx={cell}>{l.consultant_name || "-"}</TableCell>
                        <TableCell sx={cell}><b>{l.lifecycle_status}</b></TableCell>
                        <TableCell sx={cell}>{l.suppress_note || "-"}</TableCell>
                        {canAct && (
                          <TableCell sx={cell} align="center">
                            <Button size="small" variant="outlined" disabled={busyId === l.id}
                              onClick={() => window.confirm("Allow this lead to be recycled again?") && act(l.id, "release", "PUT")}
                              sx={{ textTransform: "none" }}>Release</Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : shown.length === 0 ? (
            <Alert severity="info">No leads in this list right now.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: "68vh", border: GRID, borderRadius: 1 }}>
              <Table size="small" stickyHeader sx={{ borderCollapse: "collapse", minWidth: 1600 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...head, width: 44 }} align="center">#</TableCell>
                    <TableCell sx={head}>Lead</TableCell>
                    <TableCell sx={head}>Mobile</TableCell>
                    <TableCell sx={head} align="center">Status</TableCell>
                    <TableCell sx={head}>Ownership state</TableCell>
                    <TableCell sx={head}>Consultant</TableCell>
                    <TableCell sx={head} align="center">Cycle</TableCell>
                    <TableCell sx={head} align="center">Total age (d)</TableCell>
                    <TableCell sx={head} align="center">No activity (d)</TableCell>
                    <TableCell sx={head} align="center">In status (d)</TableCell>
                    <TableCell sx={head} align="center">Since assigned (d)</TableCell>
                    <TableCell sx={head} align="center">Attempts</TableCell>
                    <TableCell sx={head} align="center">Reminders sent</TableCell>
                    <TableCell sx={head}>Rule result</TableCell>
                    {canAct && <TableCell sx={head} align="center">Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shown.map((l, idx) => {
                    const st = STATE_STYLE[l.state] || { bg: "#eee", fg: "#333", border: "#ccc", label: l.state };
                    const ls = STATUS_STYLE[l.status] || { bg: "#eee", fg: "#333" };
                    const holdOn = l.hold_until && new Date(l.hold_until) > new Date();
                    const noDept = l.state === "exception" && String(l.reason).startsWith("no department");
                    return (
                      <TableRow key={l.id} hover sx={{ bgcolor: idx % 2 ? "#f7f9fc" : "#fff" }}>
                        <TableCell sx={cell} align="center">{idx + 1}</TableCell>
                        <TableCell sx={{ ...cell, fontWeight: 600 }}>{l.lead_name}</TableCell>
                        <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>{l.contact_number}</TableCell>
                        <TableCell sx={cell} align="center">
                          <Chip size="small" label={l.lifecycle_status} sx={{ bgcolor: ls.bg, color: ls.fg, fontWeight: 600 }} />
                          {l.status === "Dead" && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {l.dead_reason_label ? `Reason: ${l.dead_reason_label}` : "Reason: not set"}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ ...cell, fontWeight: 600, color: OWNER_STYLE[l.ownership_state] || "#333", whiteSpace: "nowrap" }}>
                          {l.ownership_state}
                        </TableCell>
                        <TableCell sx={cell}>{l.consultant_name || "-"}</TableCell>
                        <TableCell sx={cell} align="center">{l.cycle_no}</TableCell>
                        <TableCell sx={cell} align="center">{l.total_age_days}</TableCell>
                        <TableCell sx={cell} align="center">{l.idle_days}</TableCell>
                        <TableCell sx={cell} align="center">{l.days_in_status}</TableCell>
                        <TableCell sx={cell} align="center">{l.days_since_assignment}</TableCell>
                        <TableCell sx={cell} align="center">{l.contact_attempts}</TableCell>
                        <TableCell sx={cell} align="center">{l.reminders_sent}</TableCell>
                        <TableCell sx={{ ...cell, minWidth: 210 }}>
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
                            <Box sx={{
                              px: 1.2, py: 0.2, borderRadius: 1, fontSize: 11.5, fontWeight: 700,
                              bgcolor: st.bg, color: st.fg, border: `1px solid ${st.border}`,
                            }}>{st.label}</Box>
                            <Typography variant="caption" color="text.secondary">{l.reason}</Typography>
                          </Box>
                        </TableCell>
                        {canAct && (
                          <TableCell sx={cell} align="center">
                            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" rowGap={1}>
                              {l.state === "eligible" && (
                                <Button size="small" variant="contained" disabled={busyId === l.id}
                                  onClick={() => window.confirm("Recycle this lead to the next consultant now?") && act(l.id, "recycle", "POST")}
                                  sx={{ textTransform: "none" }}>Recycle now</Button>
                              )}
                              {noDept && (
                                <Button size="small" variant="contained" color="warning" disabled={busyId === l.id}
                                  onClick={(e) => setMenu({ anchor: e.currentTarget, leadId: l.id, type: "dept" })}
                                  sx={{ textTransform: "none" }}>Set department ▾</Button>
                              )}
                              {l.status === "Dead" && (
                                <Button size="small" variant="outlined" disabled={busyId === l.id}
                                  onClick={(e) => setMenu({ anchor: e.currentTarget, leadId: l.id, type: "dead" })}
                                  sx={{ textTransform: "none" }}>Dead reason ▾</Button>
                              )}
                              {holdOn ? (
                                <Button size="small" variant="outlined" disabled={busyId === l.id}
                                  onClick={() => act(l.id, "hold", "PUT", { days: 0 })} sx={{ textTransform: "none" }}>Release hold</Button>
                              ) : (
                                <Button size="small" variant="outlined" disabled={busyId === l.id}
                                  onClick={(e) => setMenu({ anchor: e.currentTarget, leadId: l.id, type: "hold" })}
                                  sx={{ textTransform: "none" }}>Hold ▾</Button>
                              )}
                              <Button size="small" variant="outlined" color="error" disabled={busyId === l.id}
                                onClick={(e) => setMenu({ anchor: e.currentTarget, leadId: l.id, type: "suppress" })}
                                sx={{ textTransform: "none" }}>Suppress ▾</Button>
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Menu anchorEl={menu.anchor} open={Boolean(menu.anchor)} onClose={closeMenu}>
            {menuItems().map(([value, label]) => (
              <MenuItem key={String(value)} onClick={() => pick(value, label)}>{label}</MenuItem>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
}