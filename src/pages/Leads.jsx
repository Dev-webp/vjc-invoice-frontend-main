import { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Chip, Checkbox, Stack, CircularProgress, Alert,
  FormGroup, FormControlLabel, Select, InputLabel, FormControl,
  Tabs, Tab,
} from "@mui/material";

const API = "https://vjc-invoice-backend-main.vercel.app/api";

// ── Assumption: after login you store the logged-in user's basic info here.
// If your Login.jsx stores it under a different key / shape, just change
// this one line below (getCurrentUser) — nothing else needs to change.
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("vjc_invoice_user")) || {};
  } catch {
    return {};
  }
};

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("vjc_invoice_auth")}`,
});

const SOURCES = [
  "Direct Call", "Facebook", "Insta", "LinkedIn",
  "Reference", "Walk-in", "Google Ad", "WhatsApp",
];

const SERVICE_TYPES = [
  "Study", "Visit", "PR Visas", "Jobseeker Visa",
  "Opportunity Card", "Resume Marketing",
];

const COUNTRIES = [
  "Germany", "Canada", "Australia", "UK", "USA",
  "Luxembourg", "New Zealand", "Ireland", "Others",
];

const STATUS_OPTIONS = ["New", "Warm", "Cold", "Prospect", "HOLD", "Pending Agreement", "Dead"];

// Row background color per status — matches the reference screenshots
const statusRowColor = (status) => {
  switch (status) {
    case "Warm": return "#f6d9a7";
    case "Cold": return "#ffffff";
    case "Prospect": return "#a9d6d1";
    case "HOLD": return "#e3a6a1";
    case "Pending Agreement": return "#ffffff";
    case "Dead": return "#d9d9d9";
    default: return "#ffffff";
  }
};

const chipColor = (status) => {
  switch (status) {
    case "Warm": return "warning";
    case "Cold": return "info";
    case "Prospect": return "success";
    case "HOLD": return "error";
    case "Dead": return "default";
    default: return "default";
  }
};

const EMPTY_LEAD_FORM = {
  lead_name: "",
  contact_number: "",
  alternate_contact_number: "",
  email: "",
  gender: "",
  source: "",
  education_qualification: "",
  work_experience: "",
  work_description: "",
  interested_countries: [],
  service_type: "",
};

// ── Add Enquiry Form — inline (lives inside the "Add Enquiry" tab, not a popup) ──
function AddEnquiryForm({ onSaved }) {
  const [form, setForm] = useState(EMPTY_LEAD_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleCountry = (country) => {
    setForm((prev) => {
      const list = prev.interested_countries.includes(country)
        ? prev.interested_countries.filter((c) => c !== country)
        : [...prev.interested_countries, country];
      return { ...prev, interested_countries: list };
    });
  };

  const validate = () => {
    const e = {};
    if (!form.lead_name.trim()) e.lead_name = "Lead Name is required";
    if (!form.contact_number.trim()) e.contact_number = "Contact Number is required";
    if (!form.source) e.source = "Source is required";
    if (!form.service_type) e.service_type = "Service Type is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setForm(EMPTY_LEAD_FORM);
        setErrors({});
        onSaved(); // refreshes the list + switches to "View Enquiry" tab
      } else {
        alert("❌ " + (data.message || "Failed to save enquiry"));
      }
    } catch (err) {
      alert("❌ Failed to save enquiry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 640 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Add Enquiry</Typography>

        <TextField fullWidth margin="normal" label="Lead Name *"
          value={form.lead_name} onChange={set("lead_name")}
          error={!!errors.lead_name} helperText={errors.lead_name} />

        <TextField fullWidth margin="normal" label="Contact Number *"
          value={form.contact_number} onChange={set("contact_number")}
          error={!!errors.contact_number} helperText={errors.contact_number} />

        <TextField fullWidth margin="normal" label="Alternate Contact Number (Optional)"
          value={form.alternate_contact_number} onChange={set("alternate_contact_number")} />

        <TextField fullWidth margin="normal" label="Email Id"
          value={form.email} onChange={set("email")} />

        <TextField select fullWidth margin="normal" label="Gender"
          value={form.gender} onChange={set("gender")}>
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </TextField>

        <TextField select fullWidth margin="normal" label="Source *"
          value={form.source} onChange={set("source")}
          error={!!errors.source} helperText={errors.source}>
          {SOURCES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>

        <TextField fullWidth margin="normal" label="Education Qualification"
          value={form.education_qualification} onChange={set("education_qualification")} />

        <TextField fullWidth margin="normal" label="Work Experience (In Years)"
          value={form.work_experience} onChange={set("work_experience")} />

        <TextField fullWidth margin="normal" label="Work Description" multiline rows={2}
          value={form.work_description} onChange={set("work_description")} />

        {/* Interested Country — multi-select checkboxes */}
        <Typography variant="body2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
          Interested Country
        </Typography>
        <FormGroup row>
          {COUNTRIES.map((c) => (
            <FormControlLabel
              key={c}
              sx={{ width: "45%" }}
              control={
                <Checkbox
                  checked={form.interested_countries.includes(c)}
                  onChange={() => toggleCountry(c)}
                  size="small"
                />
              }
              label={c}
            />
          ))}
        </FormGroup>

        <TextField select fullWidth margin="normal" label="Service Type *"
          value={form.service_type} onChange={set("service_type")}
          error={!!errors.service_type} helperText={errors.service_type}>
          {SERVICE_TYPES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" size="large" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Enquiry"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Assign Enquiry Modal (Branch + Staff) ───────────────────────────────
function AssignEnquiryDialog({ open, onClose, selectedIds, onAssigned }) {
  const [branch, setBranch] = useState("");
  const [staffId, setStaffId] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const BRANCHES = ["Hyderabad", "Bengaluru", "Chennai", "Vijayawada"];

  useEffect(() => {
    if (!open) return;
    setBranch(""); setStaffId(""); setStaffList([]);
    // Confirmed from auth.js: GET /api/auth/employees (chairman/mis-executive only)
    // returns { success, employees: [{id, name, location, ...}] } — field is "location", not "branch"
    fetch(`${API}/auth/employees`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setStaffList(d.employees || []); })
      .catch(() => {});
  }, [open]);

  const staffForBranch = branch
    ? staffList.filter((s) => !s.location || s.location === branch)
    : staffList;

  const doAssign = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/leads/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ ids: selectedIds, branch, staff_id: staffId }),
      });
      const data = await res.json();
      if (data.success) {
        onAssigned();
        onClose();
      } else {
        alert("❌ " + (data.message || "Failed to assign"));
      }
    } catch {
      alert("❌ Failed to assign enquiry");
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "#0f9b8e", color: "#fff" }}>Assign Enquiry</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Branch *</InputLabel>
                <Select label="Branch *" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  {BRANCHES.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Staff *</InputLabel>
                <Select label="Staff *" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                  {staffForBranch.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="error" onClick={onClose}>Close</Button>
          <Button
            variant="contained"
            sx={{ bgcolor: "#0f9b8e" }}
            disabled={!branch || !staffId}
            onClick={() => setConfirmOpen(true)}
          >
            Assign Enquiry
          </Button>
        </DialogActions>
      </Dialog>

      {/* "Are you sure" confirm popup — matches screenshot 5 */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" fontWeight={700}>Are you sure</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You want to assign this enquiry?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3, gap: 2 }}>
          <Button variant="contained" color="primary" onClick={doAssign} disabled={saving}>
            {saving ? "Assigning..." : "Yes, Assign it!"}
          </Button>
          <Button variant="contained" color="error" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ── Main Lead Management Page ────────────────────────────────────────────
function LeadManagement() {
  const currentUser = getCurrentUser();
  const isChairman = currentUser.role === "chairman" || currentUser.role === "mis-executive";

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0); // 0 = Add Enquiry, 1 = View Enquiry
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      const res = await fetch(`${API}/leads?${params}`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setLeads(data.leads);
      else setError(data.message || "Failed to load leads");
    } catch {
      setError("Unable to connect to backend server!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, [statusFilter]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === leads.length ? [] : leads.map((l) => l.id));
  };

  const handleStatusChange = async (leadId, newStatus) => {
    // optimistic update
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
    try {
      await fetch(`${API}/leads/${leadId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      alert("❌ Failed to update status");
      fetchLeads();
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>Lead Management</Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: "1px solid #e0e0e0" }}
      >
        <Tab label="Add Enquiry" />
        <Tab label="View Enquiry" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Tab 0: Add Enquiry ── */}
      {tab === 0 && (
        <AddEnquiryForm
          onSaved={() => {
            fetchLeads();   // refresh the list so the new lead is already there
            setTab(1);      // jump straight to "View Enquiry" to show it
          }}
        />
      )}

      {/* ── Tab 1: View Enquiry ── */}
      {tab === 1 && (
      <>
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField select label="Status" size="small" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)} sx={{ width: 180 }}>
          <MenuItem value="All">All</MenuItem>
          {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>

        {isChairman && (
          <Button
            variant="outlined"
            disabled={selectedIds.length === 0}
            onClick={() => setAssignOpen(true)}
          >
            Assign Enquiry {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          Total Number of Records - {leads.length}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                {isChairman && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={leads.length > 0 && selectedIds.length === leads.length}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                )}
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Interested Country</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Service Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                {isChairman && <TableCell sx={{ fontWeight: 700 }}>Assigned By</TableCell>}
                <TableCell sx={{ fontWeight: 700 }}>Assigned To</TableCell>
                {isChairman && <TableCell sx={{ fontWeight: 700 }}>Created By</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No enquiries found. Click "+ Add Enquiry" to create one.
                  </TableCell>
                </TableRow>
              )}
              {leads.map((lead) => (
                <TableRow key={lead.id} sx={{ bgcolor: statusRowColor(lead.status) }}>
                  {isChairman && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    {lead.created_at ? new Date(lead.created_at).toLocaleString("en-IN") : "—"}
                  </TableCell>
                  <TableCell>{lead.lead_name}</TableCell>
                  <TableCell>{lead.contact_number}</TableCell>
                  <TableCell>{lead.email || "—"}</TableCell>
                  <TableCell>
                    {(lead.interested_countries || []).map((c) => (
                      <Chip key={c} label={c} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>{lead.service_type || "—"}</TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>
                    <TextField
                      select size="small" value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      sx={{ minWidth: 140, bgcolor: "#fff" }}
                    >
                      {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  </TableCell>
                  {isChairman && <TableCell>{lead.assigned_by_name || "—"}</TableCell>}
                  <TableCell>{lead.assigned_to_name || "Not Assigned"}</TableCell>
                  {isChairman && <TableCell>{lead.created_by_name || "—"}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      </>
      )}

      <AssignEnquiryDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        selectedIds={selectedIds}
        onAssigned={() => { setSelectedIds([]); fetchLeads(); }}
      />
    </Box>
  );
}

export default LeadManagement;