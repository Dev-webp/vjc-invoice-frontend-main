// NEW FILE — Recycling Queue tab (used from Leads.jsx via 1 import + 1 Tab + 1 render line)
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, CircularProgress, Alert, Stack,
} from "@mui/material";

const API = import.meta.env.VITE_API_URL || "https://invoice.vjcoverseas.com/api";
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("vjc_invoice_auth")}` });

const STATE_STYLE = {
  eligible:  { bg: "#e6f4ea", fg: "#1b6e35", border: "#9fd3ae", label: "ELIGIBLE" },
  hold:      { bg: "#fff4e0", fg: "#9a5b00", border: "#f2c880", label: "HOLD" },
  exception: { bg: "#fdecea", fg: "#b3261e", border: "#f3a9a3", label: "EXCEPTION" },
};
const STATUS_STYLE = {
  Warm: { bg: "#f6d9a7", fg: "#6b4300" },
  Cold: { bg: "#dbeafe", fg: "#1e3a8a" },
  Dead: { bg: "#d9d9d9", fg: "#333333" },
};

const GRID = "1px solid #d5dbe5";
const cell = { border: GRID, py: 1, px: 1.5, fontSize: 13.5, verticalAlign: "middle" };
const head = {
  border: "1px solid #0b3471", bgcolor: "#0b3471", color: "#fff", fontWeight: 700,
  fontSize: 13, py: 1.2, px: 1.5, whiteSpace: "nowrap",
};

export default function RecyclingQueueTab({ canAct }) {
  const [items, setItems] = useState([]);
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/recycle/queue`, { headers: authHeader() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed");
      setItems(data.items || []);
      setCfg(data.config || null);
    } catch (e) {
      setError(e.message || "Failed to load recycling queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = { all: items.length, eligible: 0, hold: 0, exception: 0 };
    items.forEach((i) => { if (c[i.state] !== undefined) c[i.state] += 1; });
    return c;
  }, [items]);

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

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight="bold">Recycling Queue</Typography>
        <Button size="small" variant="outlined" onClick={load} sx={{ textTransform: "none" }}>Refresh</Button>
      </Stack>

      {cfg && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Auto-recycle after idle: Warm {cfg.warmDays}d · Cold {cfg.coldDays}d · Dead {cfg.deadDays}d · Max cycles {cfg.maxCycles}.
          Converted / Sale leads are never recycled.
        </Typography>
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", rowGap: 1 }}>
        <FilterChip k="all" label="All" />
        <FilterChip k="eligible" label="Eligible" />
        <FilterChip k="hold" label="Hold" />
        <FilterChip k="exception" label="Exception" />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={28} /></Box>
      ) : shown.length === 0 ? (
        <Alert severity="info">No leads in this list right now.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: "68vh", border: GRID, borderRadius: 1 }}>
          <Table size="small" stickyHeader sx={{ borderCollapse: "collapse", minWidth: 1050 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...head, width: 48 }} align="center">#</TableCell>
                <TableCell sx={head}>Lead</TableCell>
                <TableCell sx={head}>Mobile</TableCell>
                <TableCell sx={head} align="center">Status</TableCell>
                <TableCell sx={head}>Consultant</TableCell>
                <TableCell sx={head} align="center">Cycle</TableCell>
                <TableCell sx={head} align="center">Idle (days)</TableCell>
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
                      <Chip size="small" label={l.status} sx={{ bgcolor: ls.bg, color: ls.fg, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={cell}>{l.consultant_name || "-"}</TableCell>
                    <TableCell sx={cell} align="center">{l.cycle_no}</TableCell>
                    <TableCell sx={cell} align="center">{l.idle_days}</TableCell>
                    <TableCell sx={cell} align="center">{l.contact_attempts}</TableCell>
                    <TableCell sx={{ ...cell, minWidth: 190 }}>
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
                          {l.state === "hold" && l.hold_until ? (
                            <Button size="small" variant="outlined" disabled={busyId === l.id}
                              onClick={() => act(l.id, "hold", "PUT", { days: 0 })} sx={{ textTransform: "none" }}>Release hold</Button>
                          ) : (
                            <Button size="small" variant="outlined" disabled={busyId === l.id}
                              onClick={() => act(l.id, "hold", "PUT", { days: 7 })} sx={{ textTransform: "none" }}>Hold 7d</Button>
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
      )}
    </Box>
  );
}