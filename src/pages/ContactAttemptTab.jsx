// NEW FILE — "Log Attempt" tab for consultants (Section 05). Shown via 1 import + 1 Tab + 1 render line in Leads.jsx.
// Attempts are SELF-REPORTED (no telephony integration). Also exports AttemptHistoryDialog (used by Recycling Queue).
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button,
  CircularProgress, Alert, Stack, TextField, Select, FormControl, InputLabel, MenuItem, Checkbox,
  FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";

const API = import.meta.env.VITE_API_URL || "https://invoice.vjcoverseas.com/api";
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("vjc_invoice_auth")}` });
const jsonHeaders = () => ({ "Content-Type": "application/json", ...authHeader() });

const GRID = "1px solid #d5dbe5";
const cell = { border: GRID, py: 1, px: 1.2, fontSize: 13, verticalAlign: "middle" };
const head = { border: "1px solid #0b3471", bgcolor: "#0b3471", color: "#fff", fontWeight: 700, fontSize: 12.5, py: 1.1, px: 1.2, whiteSpace: "nowrap" };
const fmt = (v) => (v ? new Date(v).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "-");
const fmtD = (v) => (v ? new Date(v).toLocaleDateString("en-GB") : "-");
const ymd = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");
const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const CHANNELS = [["call", "Call"], ["whatsapp", "WhatsApp"], ["sms", "SMS"], ["email", "Email"], ["visit", "Visit"], ["other", "Other"]];
const OUTCOMES = [["connected", "Connected"], ["no_answer", "No answer"], ["busy", "Busy"], ["wrong_number", "Wrong number"], ["callback", "Callback requested"]];
const label = (arr, k) => (arr.find((x) => x[0] === k) || [k, k])[1];

// ───────── In-system notifications (no WhatsApp): follow-up warnings, recycled-to-you, admin alerts ─────────
export function NotificationsPanel() {
  const [data, setData] = useState({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/recycle/notifications`, { headers: authHeader() }).then((x) => x.json());
      if (r.success) setData({ items: r.items || [], unread: r.unread || 0 });
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);
  const markRead = async (ids) => {
    try { await fetch(`${API}/recycle/notifications/read`, { method: "POST", headers: jsonHeaders(), body: JSON.stringify(ids ? { ids } : {}) }); } catch { /* ignore */ }
    load();
  };
  const unreadItems = data.items.filter((n) => !n.read_at);
  const shownItems = open ? data.items : unreadItems.slice(0, 5);
  if (data.items.length === 0) return null;
  return (
    <Alert severity={data.unread ? "warning" : "info"} sx={{ mb: 2, alignItems: "flex-start" }}
      action={
        <Stack direction="row" spacing={1}>
          {data.unread > 0 && <Button size="small" onClick={() => markRead()} sx={{ textTransform: "none" }}>Mark all read</Button>}
          <Button size="small" onClick={() => setOpen(!open)} sx={{ textTransform: "none" }}>{open ? "Show unread only" : "Show all"}</Button>
        </Stack>
      }>
      <b>Notifications{data.unread ? ` (${data.unread} new)` : ""}</b>
      {shownItems.length === 0 && <Typography variant="body2">No new notifications.</Typography>}
      {shownItems.map((n) => (
        <Typography key={n.id} variant="body2" sx={{ mt: 0.5, fontWeight: n.read_at ? 400 : 600 }}>
          • {n.message} <Typography component="span" variant="caption" color="text.secondary">({fmt(n.created_at)})</Typography>
          {!n.read_at && <Button size="small" onClick={() => markRead([n.id])} sx={{ textTransform: "none", ml: 1, py: 0 }}>Mark read</Button>}
        </Typography>
      ))}
    </Alert>
  );
}

// ───────── Lead brief: what the consultant who receives a lead sees (neutral label, customer facts, promises, restrictions) ─────────
export function LeadBriefDialog({ leadId, onClose }) {
  const [b, setB] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    fetch(`${API}/recycle/${leadId}/brief`, { headers: authHeader() }).then((r) => r.json())
      .then((d) => { if (!live) return; if (d.success) setB(d.brief); else setError(d.message || "Failed to load"); })
      .catch(() => live && setError("Request failed"));
    return () => { live = false; };
  }, [leadId]);
  const Row = ({ k, v }) => (<Typography variant="body2" sx={{ mb: 0.3 }}><b>{k}:</b> {v || "-"}</Typography>);
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{b ? b.label : "Assigned Lead"} {b && <Typography component="span" variant="body2" color="text.secondary">— {b.customer.name}</Typography>}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        {!b && !error && <Box sx={{ p: 3, textAlign: "center" }}><CircularProgress size={26} /></Box>}
        {b && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Customer</Typography>
              <Row k="Mobile" v={b.customer.contact} />
              {b.customer.alternate_contact && <Row k="Alternate" v={b.customer.alternate_contact} />}
              <Row k="Service" v={b.customer.service} />
              <Row k="Country" v={b.customer.countries.join(", ")} />
            </Box>
            <Alert severity="info" sx={{ py: 0 }}><b>Next action:</b> {b.next_action.text}{b.next_action.customer_confirmed ? " (customer-confirmed)" : ""}</Alert>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Contact restrictions</Typography>
              {b.restrictions.items.length > 0
                ? <Alert severity="error" sx={{ py: 0 }}>{b.restrictions.items.map((x) => <div key={x}>• {x}</div>)}</Alert>
                : <Alert severity="success" sx={{ py: 0 }}>None recorded. Please avoid repeated or unwanted contact.</Alert>}
              {b.restrictions.permission_history.map((p, i) => (
                <Typography key={i} variant="caption" display="block" color="text.secondary">
                  {fmtD(p.at)} — {String(p.action).replace(/_/g, " ")}: {p.reason}
                </Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Promised dates</Typography>
              {b.promised_dates.length === 0 ? <Typography variant="body2">None recorded.</Typography> : b.promised_dates.map((d, i) => (
                <Typography key={i} variant="body2">• {fmtD(d.date)}{d.rescheduled_from ? ` (moved from ${fmtD(d.rescheduled_from)})` : ""}</Typography>
              ))}
              <Typography variant="caption" color="text.secondary">Keep earlier promises consistent with what the customer was told.</Typography>
            </Box>
            {b.earlier_context && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Earlier context</Typography>
                <Typography variant="body2">{b.earlier_context}</Typography>
              </Box>
            )}
            <Accordion disableGutters variant="outlined">
              <AccordionSummary expandIcon="▾"><Typography variant="subtitle2">Interaction history ({b.interaction_history.length})</Typography></AccordionSummary>
              <AccordionDetails>
                {b.interaction_history.length === 0 ? <Typography variant="body2">No earlier interactions recorded.</Typography> : b.interaction_history.map((h, i) => (
                  <Typography key={i} variant="body2" sx={{ mb: 0.7 }}>
                    <Typography component="span" variant="caption" color="text.secondary">{fmt(h.at)} · </Typography>
                    {h.kind === "attempt" ? `${h.channel}: ${h.outcome}` : "Note"}{h.note ? ` — ${h.note}` : ""}
                  </Typography>
                ))}
              </AccordionDetails>
            </Accordion>
          </Stack>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose} sx={{ textTransform: "none" }}>Close</Button></DialogActions>
    </Dialog>
  );
}

// ───────── Attempt + follow-up history (original date, every reschedule, reason, actor, time) ─────────
export function AttemptHistoryDialog({ leadId, leadName, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    fetch(`${API}/recycle/${leadId}/attempts`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => { if (!live) return; if (d.success) setData(d); else setError(d.message || "Failed to load"); })
      .catch(() => live && setError("Request failed"));
    return () => { live = false; };
  }, [leadId]);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Attempts &amp; follow-up history <Typography component="span" variant="body2" color="text.secondary">— {leadName}</Typography></DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        {!data && !error && <Box sx={{ p: 3, textAlign: "center" }}><CircularProgress size={26} /></Box>}
        {data && (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Contact attempts (self-reported)</Typography>
            {data.attempts.length === 0 ? <Alert severity="info">No attempts logged yet.</Alert> : (
              <TableContainer component={Paper} sx={{ border: GRID }}>
                <Table size="small" sx={{ borderCollapse: "collapse" }}>
                  <TableHead><TableRow>
                    {["When", "Channel", "Outcome", "Duration", "Ref", "Next follow-up", "Logged by", "Note"].map((h) => <TableCell key={h} sx={head}>{h}</TableCell>)}
                  </TableRow></TableHead>
                  <TableBody>
                    {data.attempts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>{fmt(a.attempt_time)}</TableCell>
                        <TableCell sx={cell}>{label(CHANNELS, a.channel)}</TableCell>
                        <TableCell sx={cell}>{label(OUTCOMES, a.outcome)}</TableCell>
                        <TableCell sx={cell}>{a.duration_seconds != null ? `${a.duration_seconds}s` : "-"}</TableCell>
                        <TableCell sx={cell}>{a.call_ref || "-"}</TableCell>
                        <TableCell sx={cell}>{fmtD(a.next_followup_date)}{a.next_followup_date && a.customer_confirmed ? " ✓ customer-confirmed" : ""}</TableCell>
                        <TableCell sx={cell}>{a.actor_name || a.actor_id}<Typography variant="caption" display="block" color="text.secondary">{a.source === "self_reported" ? "Self-reported" : a.source}</Typography></TableCell>
                        <TableCell sx={cell}>{a.note || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Typography variant="subtitle2">Follow-up dates: original and every change</Typography>
            {data.followup_history.length === 0 ? <Alert severity="info">No follow-up dates recorded.</Alert> : (
              <TableContainer component={Paper} sx={{ border: GRID }}>
                <Table size="small" sx={{ borderCollapse: "collapse" }}>
                  <TableHead><TableRow>
                    {["Changed at", "From", "To", "Reason", "By", "Source"].map((h) => <TableCell key={h} sx={head}>{h}</TableCell>)}
                  </TableRow></TableHead>
                  <TableBody>
                    {data.followup_history.map((h, i) => (
                      <TableRow key={h.id}>
                        <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>{fmt(h.changed_at)}</TableCell>
                        <TableCell sx={cell}>{h.old_date ? fmtD(h.old_date) : (i === 0 ? "(original)" : "-")}</TableCell>
                        <TableCell sx={cell}>{fmtD(h.new_date)}</TableCell>
                        <TableCell sx={cell}>{h.reason || "-"}</TableCell>
                        <TableCell sx={cell}>{h.actor_name || h.actor_id || "-"}</TableCell>
                        <TableCell sx={cell}>{h.source === "note" ? "Follow-up note" : "Attempt log"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose} sx={{ textTransform: "none" }}>Close</Button></DialogActions>
    </Dialog>
  );
}

// ───────── Log attempt dialog ─────────
function LogDialog({ lead, busy, onClose, onSubmit }) {
  const [f, setF] = useState({ channel: "call", outcome: "", attempt_time: nowLocal(), duration: "", call_ref: "", note: "", date: "", confirmed: false, reason: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const prev = ymd(lead.next_followup_date);
  const isReschedule = !!(prev && f.date && f.date !== prev);
  let problem = "";
  if (!f.outcome) problem = "Select the outcome";
  else if (f.outcome === "callback" && !f.date) problem = "Enter the next follow-up date";
  else if (isReschedule && f.reason.trim().length < 3) problem = "Reason for changing the follow-up is required";
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Log contact attempt <Typography component="span" variant="body2" color="text.secondary">— {lead.lead_name}</Typography></DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ py: 0 }}>Source: <b>Self-reported</b> (no telephony integration). Editing a note, status or follow-up date is not counted as contact.</Alert>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" fullWidth><InputLabel>Channel</InputLabel>
              <Select label="Channel" value={f.channel} onChange={set("channel")}>{CHANNELS.map(([k, l]) => <MenuItem key={k} value={k}>{l}</MenuItem>)}</Select>
            </FormControl>
            <FormControl size="small" fullWidth><InputLabel>Outcome</InputLabel>
              <Select label="Outcome" value={f.outcome} onChange={set("outcome")}>{OUTCOMES.map(([k, l]) => <MenuItem key={k} value={k}>{l}</MenuItem>)}</Select>
            </FormControl>
          </Stack>
          <TextField size="small" type="datetime-local" label="Attempt time" InputLabelProps={{ shrink: true }} value={f.attempt_time} onChange={set("attempt_time")} />
          <Stack direction="row" spacing={2}>
            <TextField size="small" type="number" label="Duration (seconds, optional)" value={f.duration} onChange={set("duration")} fullWidth />
            <TextField size="small" label="Call reference (optional)" value={f.call_ref} onChange={set("call_ref")} inputProps={{ maxLength: 60 }} fullWidth />
          </Stack>
          <TextField size="small" type="date" label={f.outcome === "callback" ? "Next follow-up date — required" : "Next follow-up date (optional)"}
            InputLabelProps={{ shrink: true }} value={f.date} onChange={set("date")} inputProps={{ min: new Date().toISOString().slice(0, 10) }} />
          {f.date && (
            <FormControlLabel control={<Checkbox checked={f.confirmed} onChange={(e) => setF({ ...f, confirmed: e.target.checked })} />}
              label="The customer confirmed this date (documented customer-approved follow-up)" />
          )}
          {prev && <Typography variant="caption" color="text.secondary">Current follow-up: {fmtD(prev)}. The original date and every change are kept.</Typography>}
          {isReschedule && <TextField size="small" label="Reason for changing the follow-up date — required" value={f.reason} onChange={set("reason")} inputProps={{ maxLength: 255 }} />}
          <TextField size="small" multiline minRows={2} label="Note (optional)" value={f.note} onChange={set("note")} inputProps={{ maxLength: 255 }} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancel</Button>
        <Button variant="contained" disabled={!!problem || busy} sx={{ textTransform: "none" }}
          onClick={() => onSubmit(lead, {
            channel: f.channel, outcome: f.outcome, attempt_time: new Date(f.attempt_time).toISOString(),
            duration_seconds: f.duration === "" ? null : Number(f.duration), call_ref: f.call_ref || undefined,
            note: f.note || undefined, next_followup_date: f.date || undefined, customer_confirmed: !!f.date && f.confirmed,
            reschedule_reason: isReschedule ? f.reason.trim() : undefined,
          })}>{problem || "Save attempt"}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ───────── Tab ─────────
export default function ContactAttemptTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [logFor, setLogFor] = useState(null);
  const [histFor, setHistFor] = useState(null);
  const [briefFor, setBriefFor] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API}/recycle/my-leads`, { headers: authHeader() }).then((x) => x.json());
      if (!r.success) throw new Error(r.message || "Failed to load your leads");
      setItems(r.items || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return s ? items.filter((l) => `${l.lead_name} ${l.contact_number}`.toLowerCase().includes(s)) : items;
  }, [items, search]);

  const submit = async (lead, body) => {
    setBusy(true);
    try {
      const r = await fetch(`${API}/recycle/${lead.id}/attempt`, { method: "POST", headers: jsonHeaders(), body: JSON.stringify(body) }).then((x) => x.json());
      if (!r.success) alert("❌ " + (r.message || "Failed")); else setLogFor(null);
    } catch { alert("❌ Request failed"); }
    setBusy(false);
    load();
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" rowGap={1}>
        <Typography variant="h6" fontWeight="bold">Log Attempt</Typography>
        <Stack direction="row" spacing={1}>
          <TextField size="small" placeholder="Search name / mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button size="small" variant="outlined" onClick={load} sx={{ textTransform: "none" }}>Refresh</Button>
        </Stack>
      </Stack>
      <NotificationsPanel />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Record every genuine customer contact with its outcome. Only logged attempts count as meaningful activity for aging and recycling.
        Entries are self-reported and stored with your name and time.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={28} /></Box> : shown.length === 0 ? <Alert severity="info">No leads assigned to you.</Alert> : (
        <TableContainer component={Paper} sx={{ maxHeight: "68vh", border: GRID, borderRadius: 1 }}>
          <Table size="small" stickyHeader sx={{ borderCollapse: "collapse", minWidth: 900 }}>
            <TableHead><TableRow>
              {["#", "Lead", "Mobile", "Status", "Attempts", "Last attempt", "Pending follow-up", "Action"].map((h) => <TableCell key={h} sx={head}>{h}</TableCell>)}
            </TableRow></TableHead>
            <TableBody>
              {shown.map((l, i) => (
                <TableRow key={l.id} hover sx={{ bgcolor: i % 2 ? "#f7f9fc" : "#fff" }}>
                  <TableCell sx={cell}>{i + 1}</TableCell>
                  <TableCell sx={{ ...cell, fontWeight: 600 }}>{l.lead_name}</TableCell>
                  <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>{l.contact_number}</TableCell>
                  <TableCell sx={cell}>{l.status}</TableCell>
                  <TableCell sx={cell}>{l.attempts}</TableCell>
                  <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>{fmt(l.last_attempt_at)}</TableCell>
                  <TableCell sx={cell}>
                    {l.next_followup_date ? <>{fmtD(l.next_followup_date)} {l.customer_confirmed && <Chip size="small" label="customer-confirmed" color="success" />}</> : "-"}
                  </TableCell>
                  <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="contained" onClick={() => setLogFor(l)} sx={{ textTransform: "none" }}>Log attempt</Button>
                      <Button size="small" variant="outlined" onClick={() => setBriefFor(l)} sx={{ textTransform: "none" }}>Brief</Button>
                      <Button size="small" variant="outlined" onClick={() => setHistFor(l)} sx={{ textTransform: "none" }}>History</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {logFor && <LogDialog lead={logFor} busy={busy} onClose={() => setLogFor(null)} onSubmit={submit} />}
      {briefFor && <LeadBriefDialog leadId={briefFor.id} onClose={() => setBriefFor(null)} />}
      {histFor && <AttemptHistoryDialog leadId={histFor.id} leadName={histFor.lead_name} onClose={() => setHistFor(null)} />}
    </Box>
  );
}