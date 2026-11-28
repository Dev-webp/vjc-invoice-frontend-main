// NEW FILE (v6) — Recycling Queue + Rules tab (already wired into Leads.jsx: 1 import + 1 Tab + 1 render line)
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, CircularProgress, Alert, Stack, Checkbox, TextField,
  Select, FormControl, InputLabel, MenuItem, ToggleButtonGroup, ToggleButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";

import { AttemptHistoryDialog, NotificationsPanel } from "./ContactAttemptTab";

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
  ["no_response", "No Response / Follow-up Missed"],
  ["budget", "Budget / Not Now"],
  ["timing", "Timing"],
  ["not_interested", "Not Interested"],
  ["wrong_number", "Wrong Number / Invalid"],
  ["duplicate", "Duplicate"],
  ["not_eligible", "Not Eligible / Service Not Offered"],
  ["do_not_contact", "Do Not Contact / Opt-out"],
];
const DEAD_HINT = {
  not_reachable: "Eligible only after the minimum attempts on distinct days + cooldown.",
  no_response: "Eligible after minimum attempts + cooldown. If the client asked for a date, enter it — it waits until it passes.",
  budget: "Held until the customer-confirmed future date. Date is required.",
  timing: "Held until the customer-confirmed future date. Date is required.",
  not_interested: "Customer refused — goes to Exception / suppression review. Never auto-recycled.",
  wrong_number: "Suppressed immediately and flagged for data correction. No dial / recycle.",
  duplicate: "Suppressed and linked to the original (canonical) lead.",
  not_eligible: "Goes to Exception — disqualify or manager decision. No blind recycle.",
  do_not_contact: "Permanent suppression until documented re-consent / authorized correction.",
};

const GRID = "1px solid #d5dbe5";
const cell = { border: GRID, py: 1, px: 1.2, fontSize: 13, verticalAlign: "middle" };
const head = {
  border: "1px solid #0b3471", bgcolor: "#0b3471", color: "#fff", fontWeight: 700,
  fontSize: 12.5, py: 1.1, px: 1.2, whiteSpace: "nowrap",
};
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("en-GB") : "-");

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
    const tdef = data.triggers.find((x) => x.key === key) || {};
    const own = depId && !tdef.globalOnly ? find(depId, key) : null;
    const glob = find(null, key);
    const src = own || glob || data.defaults[key];
    return { enabled: src.enabled, value: src.value, overridden: depId && !tdef.globalOnly ? !!own : !!glob };
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
              const noValue = !!t.noValue;
              const locked = !canEdit || (t.globalOnly && !!depId);
              return (
                <TableRow key={t.key} sx={{ bgcolor: i % 2 ? "#f7f9fc" : "#fff" }}>
                  <TableCell sx={{ ...cell, fontWeight: 600 }}>{t.label}</TableCell>
                  <TableCell sx={cell} align="center">
                    <Checkbox size="small" checked={!!enabled} disabled={locked || !!t.alwaysOn}
                      onChange={(ev) => setEdits({ ...edits, [t.key]: { ...e, enabled: ev.target.checked } })} />
                  </TableCell>
                  <TableCell sx={cell} align="center">
                    {noValue ? "—" : (
                      <TextField size="small" type="number" value={value} disabled={locked}
                        inputProps={{ min: 0, max: 3650, style: { width: 70, textAlign: "center" } }}
                        onChange={(ev) => setEdits({ ...edits, [t.key]: { ...e, value: ev.target.value } })} />
                    )}
                  </TableCell>
                  <TableCell sx={cell}>{t.unit}</TableCell>
                  <TableCell sx={cell}>
                    {t.globalOnly && depId ? "Global only" : cur.overridden ? <b>{depId ? "Department override" : "Global (custom)"}</b> : depId ? "Inherited" : "Built-in default"}
                  </TableCell>
                  {canEdit && (
                    <TableCell sx={cell} align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button size="small" variant="contained" disabled={!dirty || saving === t.key || locked}
                          onClick={() => save(t.key)} sx={{ textTransform: "none" }}>Save</Button>
                        {cur.overridden && !locked && (
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

// ───────────────────────── Timeline (Director/Admin: full event history of a lead) ─────────────────────────
const TYPE_COLOR = { created: "default", assignment: "primary", recycle: "secondary", status: "info", override: "warning", attempt: "success", followup: "default" };
function TimelineDialog({ lead, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    fetch(`${API}/recycle/${lead.id}/timeline`, { headers: authHeader() }).then((r) => r.json())
      .then((d) => { if (!live) return; if (d.success) setData(d); else setError(d.message || "Failed to load"); })
      .catch(() => live && setError("Request failed"));
    return () => { live = false; };
  }, [lead.id]);
  const S = data?.summary;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Timeline <Typography component="span" variant="body2" color="text.secondary">— {lead.lead_name}</Typography></DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        {!data && !error && <Box sx={{ p: 3, textAlign: "center" }}><CircularProgress size={26} /></Box>}
        {data && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
              <Chip label={`Current owner: ${S.current_owner || "-"}`} />
              <Chip label={`Prior owners: ${S.prior_owners.length ? S.prior_owners.join(", ") : "none"}`} />
              <Chip label={`Cycle: ${S.cycles}`} />
              <Chip label={`Attempts logged: ${S.attempts_logged}`} />
              <Chip label={`Notes: ${S.notes_total}`} />
              <Chip label={`Status changes: ${S.status_changes}`} />
              <Chip label={`Admin overrides: ${S.overrides}`} />
              {S.dead_reason && <Chip color="warning" label={`Dead reason: ${S.dead_reason}${S.dead_outcome ? ` — ${S.dead_outcome}` : ""}`} />}
              {S.suppressed && <Chip color="error" label={`Suppressed: ${S.suppressed}`} />}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Status changes are recorded from the day tracking was installed; earlier status history and who changed a status are not available in the existing system.
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: "55vh", border: GRID }}>
              <Table size="small" stickyHeader sx={{ borderCollapse: "collapse" }}>
                <TableHead><TableRow>{["When", "Type", "Event", "Detail", "By"].map((h) => <TableCell key={h} sx={head}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {data.events.map((e, i) => (
                    <TableRow key={i} sx={{ bgcolor: i % 2 ? "#f7f9fc" : "#fff" }}>
                      <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>{new Date(e.at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                      <TableCell sx={cell}><Chip size="small" color={TYPE_COLOR[e.type] || "default"} label={e.type} /></TableCell>
                      <TableCell sx={{ ...cell, fontWeight: 600 }}>{e.title}</TableCell>
                      <TableCell sx={cell}>{e.detail || "-"}</TableCell>
                      <TableCell sx={cell}>{e.actor || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose} sx={{ textTransform: "none" }}>Close</Button></DialogActions>
    </Dialog>
  );
}

// ───────────────────────── Health (queue / scheduled-run monitoring) ─────────────────────────
function HealthPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    fetch(`${API}/recycle/health`, { headers: authHeader() }).then((r) => r.json())
      .then((d) => (d.success ? setData(d) : setError(d.message || "Failed to load")))
      .catch(() => setError("Request failed"));
  }, []);
  useEffect(() => { load(); }, [load]);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={28} /></Box>;
  return (
    <Stack spacing={2}>
      {data.stale
        ? <Alert severity="warning">The scheduled recycling job has not run{data.hours_since_last_run === null ? " yet" : ` for ${data.hours_since_last_run} hours`} (alert after {data.staleHours}h). Check the cron entry for /api/recycle/run.</Alert>
        : <Alert severity="success">Scheduled job last ran {data.hours_since_last_run} hours ago.</Alert>}
      {data.errors_7d > 0 && <Alert severity="error">{data.errors_7d} recycling error(s) in the last 7 days — see below.</Alert>}
      {data.blocked > 0 && <Alert severity="warning">{data.blocked} lead(s) are waiting because no other eligible consultant is available.</Alert>}
      <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
        {data.queue_by_state.length === 0 ? <Chip label="Queue is empty (fills when the scheduled job runs)" /> : data.queue_by_state.map((q) => <Chip key={q.state} label={`${q.state}: ${q.c}`} />)}
        <Button size="small" variant="outlined" onClick={load} sx={{ textTransform: "none" }}>Refresh</Button>
      </Stack>
      <Typography variant="subtitle2">Recent errors</Typography>
      {data.recent_errors.length === 0 ? <Alert severity="info">No errors.</Alert> : (
        <TableContainer component={Paper} sx={{ border: GRID }}>
          <Table size="small" sx={{ borderCollapse: "collapse" }}>
            <TableHead><TableRow>{["When", "Lead", "Stage", "Message"].map((h) => <TableCell key={h} sx={head}>{h}</TableCell>)}</TableRow></TableHead>
            <TableBody>{data.recent_errors.map((e) => (
              <TableRow key={e.id}>
                <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>{new Date(e.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                <TableCell sx={cell}>{e.lead_name || "-"}</TableCell><TableCell sx={cell}>{e.stage}</TableCell><TableCell sx={cell}>{e.message}</TableCell>
              </TableRow>))}</TableBody>
          </Table>
        </TableContainer>
      )}
      <Typography variant="subtitle2">Recent runs</Typography>
      <TableContainer component={Paper} sx={{ border: GRID }}>
        <Table size="small" sx={{ borderCollapse: "collapse" }}>
          <TableHead><TableRow>{["Started", "Type", "Checked", "Eligible", "Recycled", "Blocked", "Errors", "Result"].map((h) => <TableCell key={h} sx={head}>{h}</TableCell>)}</TableRow></TableHead>
          <TableBody>
            {data.runs.length === 0 && <TableRow><TableCell sx={cell} colSpan={8}>No runs recorded yet.</TableCell></TableRow>}
            {data.runs.map((r) => (
              <TableRow key={r.id}>
                <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>{new Date(r.started_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                <TableCell sx={cell}>{r.dry ? "Dry run" : "Live"}</TableCell>
                <TableCell sx={cell}>{r.summary?.checked ?? "-"}</TableCell><TableCell sx={cell}>{r.summary?.eligible ?? "-"}</TableCell>
                <TableCell sx={cell}>{r.summary?.recycled ?? "-"}</TableCell><TableCell sx={cell}>{r.summary?.no_consultant ?? "-"}</TableCell>
                <TableCell sx={cell}>{r.summary?.errors ?? "-"}</TableCell>
                <TableCell sx={cell}>{r.error ? <b style={{ color: "#b3261e" }}>Failed: {r.error}</b> : r.finished_at ? "OK" : "Running / interrupted"}</TableCell>
              </TableRow>))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

// ───────────────────────── Analytics (manager flags — patterns only, never an accusation) ─────────────────────────
function AnalyticsPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`${API}/recycle/analytics`, { headers: authHeader() }).then((r) => r.json())
      .then((d) => (d.success ? setData(d) : setError(d.message || "Failed to load")))
      .catch(() => setError("Request failed"));
  }, []);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={28} /></Box>;
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        These are <b>patterns for manager review only</b> — not a conclusion about any consultant. Early-Dead uses status-change tracking, so it covers
        leads marked Dead since tracking started.
      </Alert>
      <TableContainer component={Paper} sx={{ border: GRID, borderRadius: 1 }}>
        <Table size="small" sx={{ borderCollapse: "collapse", minWidth: 900 }}>
          <TableHead><TableRow>
            {["Consultant", "Leads", "Dead", `Dead within ${data.thresholds.flagEarlyDeadDays}d of assignment`, `Leads postponed ${data.thresholds.flagPostponeCount}+ times`, "Total reschedules", "Review flag"].map((h) => <TableCell key={h} sx={head}>{h}</TableCell>)}
          </TableRow></TableHead>
          <TableBody>
            {data.consultants.map((c, i) => (
              <TableRow key={c.id} sx={{ bgcolor: i % 2 ? "#f7f9fc" : "#fff" }}>
                <TableCell sx={{ ...cell, fontWeight: 600 }}>{c.name}</TableCell>
                <TableCell sx={cell} align="center">{c.assigned_total}</TableCell>
                <TableCell sx={cell} align="center">{c.dead_total}</TableCell>
                <TableCell sx={cell} align="center">{c.early_dead}</TableCell>
                <TableCell sx={cell} align="center">{c.repeat_postponed_leads}</TableCell>
                <TableCell sx={cell} align="center">{c.reschedules_total}</TableCell>
                <TableCell sx={cell}>
                  {c.flags.length === 0 ? "—" : c.flags.map((f) => (
                    <Chip key={f} size="small" color="warning" variant="outlined" label={`Review suggested: ${f}`} sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ───────────────────────── Admin action dialog (mandatory reason, actor is logged) ─────────────────────────
const EMPTY_FORM = { note: "", reason: "", outcome: "", date: "", duplicateOf: "", deptId: "", holdMode: "7", holdDate: "" };

function ActionDialog({ dlg, departments, busy, onClose, onSubmit }) {
  const [f, setF] = useState(EMPTY_FORM);
  useEffect(() => { setF(EMPTY_FORM); }, [dlg?.type, dlg?.lead?.id]);
  if (!dlg) return null;
  const { type, lead } = dlg;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const titles = {
    recycle: "Recycle now (admin override)",
    unhold: "Release hold",
    hold: "Hold lead",
    suppress: "Suppress lead",
    release: "Release suppression",
    dead: "Dead reason",
    dept: "Set department",
  };
  const noteLabel = {
    release: "Reason (documented re-consent / authorized correction) — required",
    dead: "Notes — required",
  }[type] || "Reason — required";

  const dateNeeded = type === "dead" && ["budget", "timing"].includes(f.reason);
  const dateShown = type === "dead" && ["budget", "timing", "no_response"].includes(f.reason);
  const dupShown = (type === "dead" || type === "suppress") && f.reason === "duplicate";

  let problem = "";
  if (String(f.note).trim().length < 3) problem = "Reason / notes are mandatory";
  else if (type === "dead" && !f.reason) problem = "Select a reason";
  else if (type === "dead" && String(f.outcome).trim().length < 2) problem = "Outcome is mandatory";
  else if (dateNeeded && !f.date) problem = "Customer-confirmed date is required";
  else if (dupShown && !String(f.duplicateOf).trim()) problem = "Enter the canonical (original) lead ID";
  else if (type === "suppress" && !f.reason) problem = "Select a reason";
  else if (type === "dept" && !f.deptId) problem = "Select a department";
  else if (type === "hold" && f.holdMode === "date" && !f.holdDate) problem = "Select the date";

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {titles[type]} <Typography component="span" variant="body2" color="text.secondary">— {lead.lead_name}</Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {type === "dead" && (
            <Alert severity="info" sx={{ py: 0 }}>
              Latest attempt: <b>{fmtDate(lead.last_attempt_at)}</b> · Attempts: <b>{lead.contact_attempts}</b> on <b>{lead.attempt_days}</b> distinct day(s)
            </Alert>
          )}
          {(type === "dead" || type === "suppress") && (
            <FormControl size="small" fullWidth>
              <InputLabel>Reason</InputLabel>
              <Select label="Reason" value={f.reason} onChange={set("reason")}>
                {(type === "dead" ? DEAD_REASONS : SUPPRESS_REASONS).map(([k, l]) => <MenuItem key={k} value={k}>{l}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          {type === "dead" && f.reason && <Typography variant="caption" color="text.secondary">{DEAD_HINT[f.reason]}</Typography>}
          {type === "dead" && (
            <TextField size="small" label="Outcome (e.g. phone switched off, customer refused) — required"
              value={f.outcome} onChange={set("outcome")} inputProps={{ maxLength: 120 }} />
          )}
          {dateShown && (
            <TextField size="small" type="date" label={dateNeeded ? "Customer-confirmed next contact date — required" : "Date requested by client (optional)"}
              InputLabelProps={{ shrink: true }} value={f.date} onChange={set("date")} />
          )}
          {dupShown && (
            <TextField size="small" type="number" label="Canonical (original) lead ID — required"
              value={f.duplicateOf} onChange={set("duplicateOf")} />
          )}
          {type === "dept" && (
            <FormControl size="small" fullWidth>
              <InputLabel>Department</InputLabel>
              <Select label="Department" value={f.deptId} onChange={set("deptId")}>
                {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          {type === "hold" && (
            <>
              <FormControl size="small" fullWidth>
                <InputLabel>Hold</InputLabel>
                <Select label="Hold" value={f.holdMode} onChange={set("holdMode")}>
                  <MenuItem value="7">7 days</MenuItem>
                  <MenuItem value="30">30 days</MenuItem>
                  <MenuItem value="date">Until a date (intake, visa window, customer date)</MenuItem>
                </Select>
              </FormControl>
              {f.holdMode === "date" && (
                <TextField size="small" type="date" label="Hold until (end of this date)" InputLabelProps={{ shrink: true }}
                  value={f.holdDate} onChange={set("holdDate")} />
              )}
            </>
          )}
          <TextField size="small" multiline minRows={2} label={noteLabel} value={f.note} onChange={set("note")} inputProps={{ maxLength: 255 }} />
          <Typography variant="caption" color="text.secondary">Your name is recorded against this action.</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancel</Button>
        <Button variant="contained" disabled={!!problem || busy} onClick={() => onSubmit(type, lead, f)} sx={{ textTransform: "none" }}>
          {problem || "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
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
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [dlg, setDlg] = useState(null);
  const [hist, setHist] = useState(null);
  const [tl, setTl] = useState(null);

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

  const submit = async (type, lead, f) => {
    const note = f.note.trim();
    let url; let method = "PUT"; let body;
    if (type === "recycle") { url = "recycle"; method = "POST"; body = { note }; }
    else if (type === "unhold") { url = "hold"; body = { days: 0, note }; }
    else if (type === "hold") { url = "hold"; body = f.holdMode === "date" ? { until: f.holdDate, note } : { days: Number(f.holdMode), note }; }
    else if (type === "suppress") { url = "suppress"; body = { reason: f.reason, duplicate_of: f.duplicateOf || undefined, note }; }
    else if (type === "release") { url = "release"; body = { note }; }
    else if (type === "dept") { url = "department"; body = { department_id: Number(f.deptId), note }; }
    else if (type === "dead") {
      url = "dead-reason";
      body = { reason: f.reason, outcome: f.outcome.trim(), date: f.date || undefined, duplicate_of: f.duplicateOf || undefined, note };
    }
    setBusy(true);
    try {
      const res = await fetch(`${API}/recycle/${lead.id}/${url}`, { method, headers: jsonHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) alert("❌ " + (data.message || "Failed"));
      else setDlg(null);
    } catch {
      alert("❌ Request failed");
    }
    setBusy(false);
    load();
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
  const btn = { textTransform: "none" };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" rowGap={1}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6" fontWeight="bold">Recycling Queue</Typography>
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="queue" sx={{ textTransform: "none", px: 2 }}>Queue</ToggleButton>
            <ToggleButton value="rules" sx={{ textTransform: "none", px: 2 }}>Rules</ToggleButton>
            <ToggleButton value="analytics" sx={{ textTransform: "none", px: 2 }}>Analytics</ToggleButton>
            <ToggleButton value="health" sx={{ textTransform: "none", px: 2 }}>Health</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        {view === "queue" && <Button size="small" variant="outlined" onClick={load} sx={btn}>Refresh</Button>}
      </Stack>

      {view === "rules" ? (
        <RulesPanel canEdit={canAct} />
      ) : view === "analytics" ? (
        <AnalyticsPanel />
      ) : view === "health" ? (
        <HealthPanel />
      ) : (
        <>
          <NotificationsPanel />
          {cfg && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Cooling {cfg.coolingDays}d after each recycle. Timeframes, max cycles per service and routing capacity are in the Rules tab (calendar days).
              Next consultant = round-robin cursor of the lead’s own team/service; the previous owner is skipped.
              Every admin action needs a reason and is logged with your name. The next consultant is always chosen by round-robin.
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            Total age = since lead created · No-activity = since last note / follow-up / assignment (status edits don’t count) ·
            In status = since status last changed · Since assigned = with current consultant · Attempts = notes (distinct days).
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
                <Table size="small" stickyHeader sx={{ borderCollapse: "collapse", minWidth: 950 }}>
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
                        <TableCell sx={cell}>
                          <b>{l.lifecycle_status}</b>
                          {l.duplicate_of && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Duplicate of #{l.duplicate_of}{l.duplicate_of_name ? ` (${l.duplicate_of_name})` : ""}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={cell}>{l.suppress_note || "-"}</TableCell>
                        {canAct && (
                          <TableCell sx={cell} align="center">
                            <Button size="small" variant="outlined" onClick={() => setDlg({ type: "release", lead: l })} sx={btn}>Release</Button>
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
              <Table size="small" stickyHeader sx={{ borderCollapse: "collapse", minWidth: 1700 }}>
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
                    <TableCell sx={head} align="center">Attempts (days)</TableCell>
                    <TableCell sx={head} align="center">Last attempt</TableCell>
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
                        <TableCell sx={cell} align="center">{l.contact_attempts} ({l.attempt_days})</TableCell>
                        <TableCell sx={{ ...cell, whiteSpace: "nowrap" }} align="center">{fmtDate(l.last_attempt_at)}</TableCell>
                        <TableCell sx={cell} align="center">{l.reminders_sent}</TableCell>
                        <TableCell sx={{ ...cell, minWidth: 220 }}>
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
                            <Box sx={{
                              px: 1.2, py: 0.2, borderRadius: 1, fontSize: 11.5, fontWeight: 700,
                              bgcolor: st.bg, color: st.fg, border: `1px solid ${st.border}`,
                            }}>{st.label}</Box>
                            <Typography variant="caption" color="text.secondary">{l.reason}</Typography>
                            {l.blocked_reason && <Typography variant="caption" sx={{ color: "#b3261e", fontWeight: 600 }}>⚠ {l.blocked_reason}</Typography>}
                            {l.queued_at && <Typography variant="caption" color="text.secondary">Queued since {fmtDate(l.queued_at)}</Typography>}
                            {l.recheck_at && <Typography variant="caption" color="text.secondary">Recheck on {fmtDate(l.recheck_at)}</Typography>}
                          </Box>
                        </TableCell>
                        {canAct && (
                          <TableCell sx={cell} align="center">
                            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" rowGap={1}>
                              <Button size="small" variant="outlined" onClick={() => setTl(l)} sx={btn}>Timeline</Button>
                              <Button size="small" variant="outlined" onClick={() => setHist(l)} sx={btn}>Attempts</Button>
                              {l.state === "eligible" && (
                                <Button size="small" variant="contained" onClick={() => setDlg({ type: "recycle", lead: l })} sx={btn}>Recycle now</Button>
                              )}
                              {noDept && (
                                <Button size="small" variant="contained" color="warning" onClick={() => setDlg({ type: "dept", lead: l })} sx={btn}>Set department</Button>
                              )}
                              {l.status === "Dead" && (
                                <Button size="small" variant="outlined" onClick={() => setDlg({ type: "dead", lead: l })} sx={btn}>Dead reason</Button>
                              )}
                              {holdOn ? (
                                <Button size="small" variant="outlined" onClick={() => setDlg({ type: "unhold", lead: l })} sx={btn}>Release hold</Button>
                              ) : (
                                <Button size="small" variant="outlined" onClick={() => setDlg({ type: "hold", lead: l })} sx={btn}>Hold</Button>
                              )}
                              <Button size="small" variant="outlined" color="error" onClick={() => setDlg({ type: "suppress", lead: l })} sx={btn}>Suppress</Button>
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

          <ActionDialog dlg={dlg} departments={departments} busy={busy} onClose={() => setDlg(null)} onSubmit={submit} />
          {tl && <TimelineDialog lead={tl} onClose={() => setTl(null)} />}
          {hist && <AttemptHistoryDialog leadId={hist.id} leadName={hist.lead_name} onClose={() => setHist(null)} />}
        </>
      )}
    </Box>
  );
}