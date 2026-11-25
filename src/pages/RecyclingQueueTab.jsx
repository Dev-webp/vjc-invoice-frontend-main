// NEW FILE — Recycling Queue tab (used from Leads.jsx via 1 import + 1 Tab + 1 render line)
import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, CircularProgress, Alert, Stack,
} from "@mui/material";

const API = import.meta.env.VITE_API_URL || "https://invoice.vjcoverseas.com/api";
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("vjc_invoice_auth")}` });

const STATE_COLOR = { eligible: "success", hold: "warning", exception: "error" };

export default function RecyclingQueueTab({ canAct }) {
  const [items, setItems] = useState([]);
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

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

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Recycling Queue</Typography>
      {cfg && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Auto-recycle after idle: Warm {cfg.warmDays}d · Cold {cfg.coldDays}d · Dead {cfg.deadDays}d · Max cycles {cfg.maxCycles}.
          Converted / Sale leads are never recycled.
        </Typography>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={28} /></Box>
      ) : items.length === 0 ? (
        <Alert severity="info">No leads in the recycling queue right now.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Lead</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Consultant</TableCell>
                <TableCell>Cycle</TableCell>
                <TableCell>Idle (days)</TableCell>
                <TableCell>Attempts</TableCell>
                <TableCell>Rule result</TableCell>
                {canAct && <TableCell>Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.lead_name}</TableCell>
                  <TableCell>{l.contact_number}</TableCell>
                  <TableCell>{l.status}</TableCell>
                  <TableCell>{l.consultant_name || "-"}</TableCell>
                  <TableCell>{l.cycle_no}</TableCell>
                  <TableCell>{l.idle_days}</TableCell>
                  <TableCell>{l.contact_attempts}</TableCell>
                  <TableCell>
                    <Chip size="small" color={STATE_COLOR[l.state] || "default"} label={l.state} />
                    <Typography variant="caption" display="block" color="text.secondary">{l.reason}</Typography>
                  </TableCell>
                  {canAct && (
                    <TableCell>
                      <Stack direction="row" spacing={1}>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}