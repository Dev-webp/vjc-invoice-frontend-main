import { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Chip, Checkbox, Stack, CircularProgress, Alert,
  FormGroup, FormControlLabel, Select, InputLabel, FormControl,
  Tabs, Tab, InputAdornment,
} from "@mui/material";
// ── Lightweight inline SVG icons ──────────────────────────────────────
// @mui/icons-material is not a dependency of this project, so importing
// from it breaks the Vercel build. These small self-contained SVGs give
// the same visual effect (icon + label) with zero extra packages.
const makeIcon = (path) => ({ fontSize = "small", sx = {} }) => (
  <Box
    component="svg"
    viewBox="0 0 24 24"
    sx={{
      width: fontSize === "small" ? 20 : 24,
      height: fontSize === "small" ? 20 : 24,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...sx,
    }}
  >
    <path d={path} />
  </Box>
);

const PersonOutlineIcon = makeIcon("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0");
const Person2OutlinedIcon = PersonOutlineIcon;
const PhoneIphoneIcon = makeIcon("M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm4 15h.01");
const PhoneIcon = makeIcon("M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11.4 21 3 12.6 3 3c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1.1L6.6 10.8Z");
const EmailOutlinedIcon = makeIcon("M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 0 8 7 8-7");
const WcIcon = makeIcon("M9 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 21v-6H4l3-7h4l3 7h-2v6M17.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0 0v5m-2.5 8 2.5-6 2.5 6m-4-3h3");
const SchoolOutlinedIcon = makeIcon("m12 3 10 5-10 5L2 8l10-5Zm-7 7.5V16c0 1.7 3.1 3 7 3s7-1.3 7-3v-5.5");
const WorkOutlineIcon = makeIcon("M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0h14a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1Z");
const DescriptionOutlinedIcon = makeIcon("M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h6m-6 4h6");
const PublicIcon = makeIcon("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18");
const CategoryOutlinedIcon = makeIcon("m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 0v10m0 0-9-5m9 5 9-5");
const CampaignOutlinedIcon = makeIcon("M3 11v2a2 2 0 0 0 2 2h1l1 5h2l-1-5h2l9 4V6l-9 4H6a2 2 0 0 0-2 2Zm7-1V6");
const ContactMailOutlinedIcon = makeIcon("M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 0 8 7 8-7M4 19l6-5m10 5-6-5");

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

// Section header bar — light teal band with icon, matches the reference
// screenshot's "Personal Details" / "Follow Up" style headers.
function SectionHeader({ icon, label }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        bgcolor: "#e3f2f1",
        color: "#0f9b8e",
        px: 2,
        py: 1,
        borderRadius: 1,
        mb: 2.5,
      }}
    >
      {icon}
      <Typography variant="subtitle1" fontWeight={700}>{label}</Typography>
    </Box>
  );
}

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

  const iconAdornment = (Icon) => ({
    startAdornment: (
      <InputAdornment position="start">
        <Icon fontSize="small" sx={{ color: "#0f9b8e" }} />
      </InputAdornment>
    ),
  });

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Add Enquiry</Typography>

        <Grid container spacing={3}>
          {/* ── Left column: Personal Details ── */}
          <Grid item xs={12} md={6}>
            <SectionHeader icon={<PersonOutlineIcon />} label="Personal Details" />

            <TextField fullWidth margin="normal" label="Lead Name *"
              value={form.lead_name} onChange={set("lead_name")}
              error={!!errors.lead_name} helperText={errors.lead_name}
              InputProps={iconAdornment(Person2OutlinedIcon)} />

            <TextField fullWidth margin="normal" label="Contact Number *"
              value={form.contact_number} onChange={set("contact_number")}
              error={!!errors.contact_number} helperText={errors.contact_number}
              InputProps={iconAdornment(PhoneIphoneIcon)} />

            <TextField fullWidth margin="normal" label="Alternate Contact Number (Optional)"
              value={form.alternate_contact_number} onChange={set("alternate_contact_number")}
              InputProps={iconAdornment(PhoneIcon)} />

            <TextField fullWidth margin="normal" label="Email Id"
              value={form.email} onChange={set("email")}
              InputProps={iconAdornment(EmailOutlinedIcon)} />

            <TextField select fullWidth margin="normal" label="Gender"
              value={form.gender} onChange={set("gender")}
              InputProps={iconAdornment(WcIcon)}>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Grid>

          {/* ── Right column: Enquiry Details ── */}
          <Grid item xs={12} md={6}>
            <SectionHeader icon={<ContactMailOutlinedIcon />} label="Enquiry Details" />

            <TextField select fullWidth margin="normal" label="Source *"
              value={form.source} onChange={set("source")}
              error={!!errors.source} helperText={errors.source}
              InputProps={iconAdornment(CampaignOutlinedIcon)}>
              {SOURCES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>

            <TextField fullWidth margin="normal" label="Education Qualification"
              value={form.education_qualification} onChange={set("education_qualification")}
              InputProps={iconAdornment(SchoolOutlinedIcon)} />

            <TextField fullWidth margin="normal" label="Work Experience (In Years)"
              value={form.work_experience} onChange={set("work_experience")}
              InputProps={iconAdornment(WorkOutlineIcon)} />

            <TextField fullWidth margin="normal" label="Work Description" multiline rows={2}
              value={form.work_description} onChange={set("work_description")}
              InputProps={iconAdornment(DescriptionOutlinedIcon)} />

            <TextField select fullWidth margin="normal" label="Service Type *"
              value={form.service_type} onChange={set("service_type")}
              error={!!errors.service_type} helperText={errors.service_type}
              InputProps={iconAdornment(CategoryOutlinedIcon)}>
              {SERVICE_TYPES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>

          {/* ── Full width: Interested Country ── */}
          <Grid item xs={12}>
            <SectionHeader icon={<PublicIcon />} label="Interested Country" />
            <FormGroup row>
              {COUNTRIES.map((c) => (
                <FormControlLabel
                  key={c}
                  sx={{ width: { xs: "100%", sm: "30%" } }}
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
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" size="large" sx={{ bgcolor: "#0f9b8e" }}
            onClick={handleSave} disabled={saving}>
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
