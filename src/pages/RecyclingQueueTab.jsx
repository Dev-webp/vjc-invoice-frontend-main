// NEW FILE (v2) — Recycling Queue tab (already wired into Leads.jsx: 1 import + 1 Tab + 1 render line)
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, CircularProgress, Alert, Stack, Menu, MenuItem,
} from "@mui/material";

const API = import.meta.env.VITE_API_URL || "https://invoice.vjcoverseas.com/api";
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("vjc_invoice_auth")}` });

const STATE_STYLE = {
  eligible:  { bg: "#e6f4ea", fg: "#1b6e35", border: "#9fd3ae", label: "ELIGIBLE" },
  hold:      { bg: "#fff4e0", fg: "#9a5b00", border: "#f2c880", label: "HOLD" },
  cooling:   { bg: "#e8f0fe", fg: "#1a4fa3", border: "#a9c3f2", label: "COOLING" },
  exception: { bg: "#fdecea", fg: "#b3261e", border: "#f3a9a3", label: "EXCEPTION" },
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

const GRID = "1px solid #d5dbe5";
const cell = { border: GRID, py: 1, px: 1.2, fontSize: 13, verticalAlign: "middle" };
const head = {
  border: "1px solid #0b3471", bgcolor: "#0b3471", color: "#fff", fontWeight: 700,
  fontSize: 12.5, py: 1.1, px: 1.2, whiteSpace: "nowrap",
};

export default function RecyclingQueueTab({ canAct }) {
  const [items, setItems] = useState([]);
  const [suppressed, setSuppressed] = useState([]);
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [menu, setMenu] = useState({ anchor: null, leadId: null });

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
      setSuppressed(s.success ? s.items || [] : []);
    } catch (e) {
      setError(e.message || "Failed to load recycling queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = { all: items.length, eligible: 0, hold: 0, cooling: 0, exception: 0, suppressed: suppressed.length };
    items.forEach((i) => { if (c[i.state] !== undefined) c[i.state] += 1; });
    return c;
  }, [items, suppressed]);

  const shown = filter === "all" ? items : items.filter((i) => i.state === filter);

  const act = async (id, url, method, body) => {
    setBusyId(id);
    try {
      const res = await fetch(`${API}/recycle/${id}/${url}`, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.success) alert("❌ " + (data.message || "Failed"));
    } catch {
      alert("❌ Request failed");
    }
    setBusyId(null);
    load();
  };

  const doSuppress = (reasonKey, label) => {
    const id = menu.leadId;
    setMenu({ anchor: null, leadId: null });
    if (!id) return;
    if (!window.confirm(`Mark this lead as "${label}"?\nIt will be removed from automatic recycling.`)) return;
    const note = window.prompt("Optional note (why?)", "") || "";
    act(id, "suppress", "PUT", { reason: reasonKey, note });
  };

  const FilterChip = ({ k, label }) => (
    <Chip
      clickable
      onClick={() => setFilter(k)}
      label={`${label} (${counts[k] ?? 0})`}
      sx={{
        fontWeight: 600,
        border: "1px solid #0b3471",
        bgcolor: filter === k ? "#0b3471" : "#fff",
        color: filter === k ? "#fff" : "#0b3471",
        "&:hover": { bgcolor: filter === k ? "#0b3471" : "#eef3fb" },
      }}
    />
  );

  const showingSuppressed = filter === "suppressed";

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight="bold">Recycling Queue</Typography>
        <Button size="small" variant="outlined" onClick={load} sx={{ textTransform: "none" }}>Refresh</Button>
      </Stack>

      {cfg && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Auto-recycle: Warm {cfg.warmDays}d no activity · Cold {cfg.coldDays}d no activity · Dead {cfg.deadDays}d in Dead ·
          Max cycles {cfg.maxCycles} · Cooling {cfg.coolingDays}d after each recycle.
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
          <Table size="small" stickyHeader sx={{ borderCollapse: "collapse", minWidth: 1500 }}>
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
                <TableCell sx={head}>Rule result</TableCell>
                {canAct && <TableCell sx={head} align="center">Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((l, idx) => {
                const st = STATE_STYLE[l.state] || { bg: "#eee", fg: "#333", border: "#ccc", label: l.state };
                const ls = STATUS_STYLE[l.status] || { bg: "#eee", fg: "#333" };
                return (
                  <TableRow key={l.id} hover sx={{ bgcolor: idx % 2 ? "#f7f9fc" : "#fff" }}>
                    <TableCell sx={cell} align="center">{idx + 1}</TableCell>
                    <TableCell sx={{ ...cell, fontWeight: 600 }}>{l.lead_name}</TableCell>
                    <TableCell sx={{ ...cell, whiteSpace: "nowrap" }}>{l.contact_number}</TableCell>
                    <TableCell sx={cell} align="center">
                      <Chip size="small" label={l.lifecycle_status} sx={{ bgcolor: ls.bg, color: ls.fg, fontWeight: 600 }} />
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
                    <TableCell sx={{ ...cell, minWidth: 200 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
                        <Box sx={{
                          px: 1.2, py: 0.2, borderRadius: 1, fontSize: 11.5, fontWeight: 700,
                          bgcolor: st.bg, color: st.fg, border: `1px solid ${st.border}`,
                        }}>{st.label}</Box>
                        <Typography variant="caption" color="text.secondary">{l.reason}</Typography>
                      </Box>
                    </TableCell>
                    {canAct && (
                      <TableCell sx={{ ...cell, whiteSpace: "nowrap" }} align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {l.state === "eligible" && (
                            <Button size="small" variant="contained" disabled={busyId === l.id}
                              onClick={() => window.confirm("Recycle this lead to the next consultant now?") && act(l.id, "recycle", "POST")}
                              sx={{ textTransform: "none" }}>Recycle now</Button>
                          )}
                          {l.hold_until && new Date(l.hold_until) > new Date() ? (
                            <Button size="small" variant="outlined" disabled={busyId === l.id}
                              onClick={() => act(l.id, "hold", "PUT", { days: 0 })} sx={{ textTransform: "none" }}>Release hold</Button>
                          ) : (
                            <Button size="small" variant="outlined" disabled={busyId === l.id}
                              onClick={() => act(l.id, "hold", "PUT", { days: 7 })} sx={{ textTransform: "none" }}>Hold 7d</Button>
                          )}
                          <Button size="small" variant="outlined" color="error" disabled={busyId === l.id}
                            onClick={(e) => setMenu({ anchor: e.currentTarget, leadId: l.id })}
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

      <Menu anchorEl={menu.anchor} open={Boolean(menu.anchor)} onClose={() => setMenu({ anchor: null, leadId: null })}>
        {SUPPRESS_REASONS.map(([key, label]) => (
          <MenuItem key={key} onClick={() => doSuppress(key, label)}>{label}</MenuItem>
        ))}
      </Menu>
    </Box>
  );
}