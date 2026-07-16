import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Grid, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Avatar, CircularProgress, Alert,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PrintIcon from "@mui/icons-material/Print";

const API = "https://vjc-invoice-backend-main.vercel.app/api";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("vjc_invoice_auth")}`,
});

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      })
    : "";

// Plain label:value row, matches the "PERSONAL DETAILS" list in screenshot 4
function DetailRow({ label, value }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid #eee",
        py: 1,
      }}
    >
      <Typography variant="body2" sx={{ color: "#555" }}>{label}:</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, textAlign: "right" }}>
        {value || ""}
      </Typography>
    </Box>
  );
}

export default function LeadProfileHistory() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [assignedHistory, setAssignedHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Assumption: GET /api/leads/:id/profile-history returns
        // { success, lead, assigned_history: [...], notes: [...] }
        const res = await fetch(`${API}/leads/${id}/profile-history`, {
          headers: authHeader(),
        });
        const data = await res.json();
        if (data.success) {
  console.log("PROFILE HISTORY RESPONSE:", data);

  setLead(data.lead);
  setAssignedHistory(data.assigned_history || []);
  setNotes(data.notes || []);
        } else {
          setError(data.message || "Failed to load profile history");
        }
      } catch {
        setError("Unable to connect to backend server!");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "#f4f6f8", minHeight: "100vh" }}>
      <Grid container spacing={3}>
        {/* ── LEFT: Profile card ── */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<PrintIcon />}
                sx={{ bgcolor: "#1a2472" }}
                onClick={() => window.print()}
              >
                Print
              </Button>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", mt: -2, mb: 2 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: "#37474f" }}>
                <PersonIcon sx={{ fontSize: 44 }} />
              </Avatar>
            </Box>

            <Box sx={{ bgcolor: "#f0f2f5", borderRadius: 1, p: 2, mb: 2 }}>
              <DetailRow label="Full Name" value={lead?.lead_name} />
              <DetailRow label="DOB" value={fmtDate(lead?.dob)} />
              <DetailRow label="Mobile" value={lead?.contact_number} />
            </Box>

            <Box sx={{ bgcolor: "#1a2472", color: "#fff", px: 2, py: 1, fontWeight: 700 }}>
              PERSONAL DETAILS
            </Box>

            <Box sx={{ px: 0.5 }}>
              <DetailRow label="Created Date" value={fmtDateTime(lead?.created_at)} />
              <DetailRow label="Updated Date" value={fmtDateTime(lead?.updated_at)} />
              <DetailRow label="Client ID" value={lead?.client_id} />
              <DetailRow label="Alt. Mobile" value={lead?.alternate_contact_number} />
              <DetailRow label="Email" value={lead?.email} />
              <DetailRow label="Marital Status" value={lead?.marital_status} />
              <DetailRow label="Nationality" value={lead?.nationality} />
              <DetailRow label="Visa Type" value={lead?.visa_type} />
              <DetailRow label="Source" value={lead?.source} />
              <DetailRow
                label="Interested Country"
                value={(lead?.interested_countries || []).join(", ")}
              />
              <DetailRow label="Address" value={lead?.address} />
              <DetailRow label="City" value={lead?.city} />
              <DetailRow label="Residence Country" value={lead?.residence_country} />
              <DetailRow label="Postal Code" value={lead?.postal_code} />
              <DetailRow label="Child" value={lead?.child} />
              <DetailRow label="Assigned By" value={lead?.assigned_by_name} />
              <DetailRow label="Assigned To" value={lead?.assigned_to_name} />
              <DetailRow label="Created By" value={lead?.created_by_name} />
              <DetailRow label="First Comment" value={lead?.first_comment} />
            </Box>
          </Paper>
        </Grid>

        {/* ── RIGHT: Assigned History + Notes ── */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, letterSpacing: 0.5 }}>
            ASSIGNED HISTORY
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#1a2472" }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Assigned By</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Assigned Date</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Branch</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>User</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignedHistory.map((h, i) => (
                  <TableRow key={h.id || i}>
                    <TableCell>{h.assigned_by_name}</TableCell>
                    <TableCell>{fmtDate(h.assigned_date)}</TableCell>
                    <TableCell>{h.branch}</TableCell>
                    <TableCell>{h.user_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, letterSpacing: 0.5 }}>
            NOTES
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#1a2472" }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Created Date</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Remark</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Stage</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Commented By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notes.map((n, i) => (
                  <TableRow key={n.id || i}>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDateTime(n.created_at)}</TableCell>
                    <TableCell>{n.remark}</TableCell>
                    <TableCell>{n.stage || "Enquiry"}</TableCell>
                    <TableCell>{n.commented_by}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}