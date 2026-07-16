import { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Chip, Checkbox, Stack, CircularProgress, Alert,
  FormGroup, FormControlLabel, Select, InputLabel, FormControl,
Tabs, Tab, InputAdornment, Divider, IconButton, Badge,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CallIcon from "@mui/icons-material/Call";
import BusinessIcon from "@mui/icons-material/Business";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import EmailIcon from "@mui/icons-material/Email";
import WcIcon from "@mui/icons-material/Wc";
import CampaignIcon from "@mui/icons-material/Campaign";
import SchoolIcon from "@mui/icons-material/School";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import DescriptionIcon from "@mui/icons-material/Description";
import PublicIcon from "@mui/icons-material/Public";
import CategoryIcon from "@mui/icons-material/Category";
import BadgeIcon from "@mui/icons-material/Badge";
import SearchIcon from "@mui/icons-material/Search";

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
  "Direct Call", "Facebook", "Instagram", "LinkedIn",
  "Reference", "Walk-in", "Google Ad", "WhatsApp",
];

const SERVICE_TYPES = [
  "Study", "Visit", "PR Visas", "Jobseeker Visa",
  "Opportunity Card", "Resume Marketing",
];

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const STATUS_OPTIONS = ["New", "Warm", "Cold", "Prospect", "HOLD", "Pending Agreement", "Dead"];
// Sticky-column layout for the View Enquiry table — Checkbox / Created-Updated /
// Name / Mobile stay pinned on the left while the remaining columns scroll.
const STICKY_COL = {
  checkbox: { width: 48, left: 0 },
  created: { width: 190, left: 48 },
  name: { width: 130, left: 238 },
  mobile: { width: 130, left: 368 },
};

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

// Small reusable section header — light teal bar, matches reference screenshot
function SectionHeader({ icon, label }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        bgcolor: "#e6f3f2",
        borderLeft: "4px solid #0f9b8e",
        px: 2,
        py: 1,
        borderRadius: "6px 6px 0 0",
        mb: 2.5,
      }}
    >
      {icon}
      <Typography variant="subtitle1" fontWeight={700} color="#0f6f65">
        {label}
      </Typography>
    </Box>
  );
}

// ── Boxed field wrapper — matches reference screenshot 2 exactly ───────────
// Label sits as PLAIN STATIC TEXT above the box (never moves).
// Inside the box: icon + input showing a placeholder (not a floating label),
// so nothing jumps or overlaps the border while typing.
function BoxedField({ icon, label, required, error, helperText, children }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, color: "#555", mb: 0.5, display: "block" }}
      >
        {label}
        {required && <span style={{ color: "#d32f2f" }}> *</span>}
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          border: "1px solid",
          borderColor: error ? "#d32f2f" : "#d9dee3",
          borderRadius: 2,
          px: 1.5,
          py: 0.25,
          bgcolor: "#fff",
          "&:hover": { borderColor: "#0f9b8e" },
          "&:focus-within": { borderColor: "#0f9b8e", boxShadow: "0 0 0 2px rgba(15,155,142,0.15)" },
        }}
      >
        <Box sx={{ color: "#7b8794", display: "flex", flexShrink: 0 }}>{icon}</Box>
        <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>{children}</Box>
      </Box>
      {error && helperText && (
        <Typography variant="caption" color="error" sx={{ ml: 0.5 }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
}

// Underlying input, styled to sit borderless inside BoxedField's own box.
// No label-related CSS needed anymore — we only ever show a placeholder now.
const boxedFieldSx = {
  width: "100%",

  "& .MuiInput-root": {
    fontSize: 14,
    width: "100%",
  },

  "& .MuiInput-root:before, & .MuiInput-root:after": {
    display: "none",
  },

  "& .MuiSelect-select": {
    padding: "8px 32px 8px 4px !important",
    display: "flex",
    alignItems: "center",
  },

  "& .MuiSelect-icon": {
    right: "4px",
    top: "50%",
    transform: "translateY(-50%)",
  },
};

// ── Add Enquiry Form — inline (lives inside the "Add Enquiry" tab, not a popup) ──
function AddEnquiryForm({ onSaved }) {
  const [form, setForm] = useState(EMPTY_LEAD_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  

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
    <Card sx={{ width: "100%", borderRadius: 2, boxShadow: 3 }}>
      {/* Breadcrumb-style header bar, matches reference screenshot */}
      <Box sx={{ bgcolor: "#0f9b8e", color: "#fff", px: 3, py: 1.5, borderRadius: "8px 8px 0 0" }}>
        <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
          Lead &raquo; Add Enquiry
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* ── SECTION 1: Personal Details — 3 fields per row, side by side ── */}
        <SectionHeader icon={<PersonIcon sx={{ color: "#0f9b8e" }} />} label="Personal Details" />
        <Grid container spacing={2.5} sx={{ mb: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <BoxedField
              icon={<PersonIcon fontSize="small" />}
              label="Lead Name"
              required
              error={!!errors.lead_name}
              helperText={errors.lead_name}
            >
              <TextField
                variant="standard" fullWidth placeholder="Lead Name" sx={boxedFieldSx}
                value={form.lead_name} onChange={set("lead_name")}
                InputProps={{ disableUnderline: true }}
              />
            </BoxedField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <BoxedField
              icon={<CallIcon fontSize="small" />}
              label="Contact Number"
              required
              error={!!errors.contact_number}
              helperText={errors.contact_number}
            >
              <TextField
                variant="standard" fullWidth placeholder="Contact Number" sx={boxedFieldSx}
                value={form.contact_number} onChange={set("contact_number")}
                InputProps={{ disableUnderline: true }}
              />
            </BoxedField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <BoxedField icon={<PhoneAndroidIcon fontSize="small" />} label="Alternate Contact Number">
              <TextField
                variant="standard" fullWidth placeholder="Alternate Contact Number" sx={boxedFieldSx}
                value={form.alternate_contact_number} onChange={set("alternate_contact_number")}
                InputProps={{ disableUnderline: true }}
              />
            </BoxedField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <BoxedField icon={<EmailIcon fontSize="small" />} label="Email Id">
              <TextField
                variant="standard" fullWidth placeholder="Email Id" sx={boxedFieldSx}
                value={form.email} onChange={set("email")}
                InputProps={{ disableUnderline: true }}
              />
            </BoxedField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <BoxedField icon={<WcIcon fontSize="small" />} label="Gender">
              <TextField
                select
                variant="standard"
                fullWidth
                sx={boxedFieldSx}
                value={form.gender}
                onChange={set("gender")}
                SelectProps={{ displayEmpty: true }}
                InputProps={{ disableUnderline: true }}
              >
                <MenuItem value="" disabled><em>Select Gender</em></MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </BoxedField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <BoxedField
              icon={<CampaignIcon fontSize="small" />}
              label="Source"
              required
              error={!!errors.source}
              helperText={errors.source}
            >
              <TextField
                select
                variant="standard"
                fullWidth
                sx={boxedFieldSx}
                value={form.source}
                onChange={set("source")}
                SelectProps={{ displayEmpty: true }}
                InputProps={{ disableUnderline: true }}
              >
                <MenuItem value="" disabled><em>Select Source</em></MenuItem>
                {SOURCES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </BoxedField>
          </Grid>
        </Grid>

        {/* ── SECTION 2: Other Details — 3 fields per row, side by side ── */}
        <SectionHeader icon={<BadgeIcon sx={{ color: "#0f9b8e" }} />} label="Other Details" />
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={4}>
            <BoxedField icon={<SchoolIcon fontSize="small" />} label="Education Qualification">
              <TextField
                variant="standard" fullWidth placeholder="Education Qualification" sx={boxedFieldSx}
                value={form.education_qualification} onChange={set("education_qualification")}
                InputProps={{ disableUnderline: true }}
              />
            </BoxedField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <BoxedField icon={<WorkHistoryIcon fontSize="small" />} label="Work Experience (In Years)">
              <TextField
                variant="standard" fullWidth placeholder="Work Experience (In Years)" sx={boxedFieldSx}
                value={form.work_experience} onChange={set("work_experience")}
                InputProps={{ disableUnderline: true }}
              />
            </BoxedField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <BoxedField
              icon={<CategoryIcon fontSize="small" />}
              label="Service Type"
              required
              error={!!errors.service_type}
              helperText={errors.service_type}
            >
              <TextField
                select
                variant="standard"
                fullWidth
                sx={boxedFieldSx}
                value={form.service_type}
                onChange={set("service_type")}
                SelectProps={{ displayEmpty: true }}
                InputProps={{ disableUnderline: true }}
              >
                <MenuItem value="" disabled><em>Select Service Type</em></MenuItem>
                {SERVICE_TYPES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </BoxedField>
          </Grid>

          {/* Work Description — wider box, own row */}
          <Grid item xs={12} md={8}>
            <BoxedField icon={<DescriptionIcon fontSize="small" sx={{ mt: 1 }} />} label="Work Description">
              <TextField
                variant="standard" fullWidth multiline rows={2} placeholder="Work Description" sx={boxedFieldSx}
                value={form.work_description} onChange={set("work_description")}
                InputProps={{ disableUnderline: true }}
              />
            </BoxedField>
          </Grid>

          {/* Interested Country — full width row, own box, matches reference */}
         <Grid item xs={12}>
  <BoxedField
    icon={<PublicIcon fontSize="small" />}
    label="Interested Country"
  >
    <TextField
      select
      variant="standard"
      fullWidth
      sx={boxedFieldSx}
      value={form.interested_countries[0] || ""}
      onChange={(e) =>
        setForm({
          ...form,
          interested_countries: [e.target.value],
        })
      }
      SelectProps={{ displayEmpty: true }}
      InputProps={{ disableUnderline: true }}
    >
      <MenuItem value="" disabled>
        <em>Select Country</em>
      </MenuItem>

      {COUNTRIES.map((country) => (
        <MenuItem key={country} value={country}>
          {country}
        </MenuItem>
      ))}
    </TextField>
  </BoxedField>
</Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="large"
            sx={{ bgcolor: "#0f9b8e", "&:hover": { bgcolor: "#0c7d72" } }}
            onClick={handleSave}
            disabled={saving}
          >
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

  const BRANCHES = ["Hyderabad", "Bangalore"];

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
        <Box
          sx={{
            bgcolor: "#1a2472",
            color: "#fff",
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" fontWeight={600}>Assign Enquiry</Typography>
          <IconButton onClick={onClose} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Branch <span style={{ color: "#d32f2f" }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <BusinessIcon fontSize="small" sx={{ color: "#7b8794" }} />
                    </InputAdornment>
                  }
                  renderValue={(v) => v || <em style={{ color: "#9aa4ae" }}>Select Branch</em>}
                >
                  {BRANCHES.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Staff <span style={{ color: "#d32f2f" }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon fontSize="small" sx={{ color: "#7b8794" }} />
                    </InputAdornment>
                  }
                  renderValue={(v) =>
                    staffForBranch.find((s) => s.id === v)?.name || <em style={{ color: "#9aa4ae" }}>Select Option</em>
                  }
                >
                  {staffForBranch.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" color="error" onClick={onClose}>Close</Button>
          <Button
            variant="contained"
            sx={{ bgcolor: "#1a2472", "&:hover": { bgcolor: "#141c5c" } }}
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
// ── Add Notes Dialog — matches reference screenshot 3 exactly ─────────────
function NotesDialog({ open, onClose, lead, onSaved }) {
  const [remark, setRemark] = useState("");
  const [addToReminder, setAddToReminder] = useState(true);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [notes, setNotes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !lead) return;
    setRemark(""); setAddToReminder(true); setReminderDate(""); setReminderTime("");
    fetch(`${API}/leads/${lead.id}/notes`, { headers: authHeader() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setNotes(d.notes || []); })
      .catch(() => {});
  }, [open, lead]);

  const handleSave = async () => {
    if (!remark.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/leads/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          remark,
          add_to_reminder: addToReminder,
          reminder_date: addToReminder ? reminderDate : null,
          reminder_time: addToReminder ? reminderTime : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
        onClose();
      } else {
        alert("❌ " + (data.message || "Failed to save note"));
      }
    } catch {
      alert("❌ Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box
        sx={{
          bgcolor: "#0f9b8e",
          color: "#fff",
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" fontWeight={600}>Add Notes</Typography>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          Remark <span style={{ color: "#d32f2f" }}>*</span>
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Enter Remark"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={addToReminder}
              onChange={(e) => setAddToReminder(e.target.checked)}
            />
          }
          label="Add to Reminder"
          sx={{ mb: 1 }}
        />

        {addToReminder && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Reminder Date
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Reminder Time
              </Typography>
              <TextField
                fullWidth
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </Grid>
          </Grid>
        )}

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700, width: 60 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remark</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Stage</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reminder</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Commented By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notes.map((n, i) => (
                <TableRow key={n.id || i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{n.remark}</TableCell>
                  <TableCell>
                    <Chip label={n.stage || "Enquiry"} size="small" color="info" variant="outlined" />
                  </TableCell>
                  <TableCell>{n.reminder || "—"}</TableCell>
                  <TableCell>{n.commented_by || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="contained" color="error" onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          sx={{ bgcolor: "#0f9b8e", "&:hover": { bgcolor: "#0c7d72" } }}
          onClick={handleSave}
          disabled={saving || !remark.trim()}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
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
  const [search, setSearch] = useState(""); // Name / Email / Mobile search — client-side filter
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesLead, setNotesLead] = useState(null);

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
    setSelectedIds(selectedIds.length === filteredLeads.length ? [] : filteredLeads.map((l) => l.id));
  };

  // Opens the full profile-history page in a NEW TAB, same layout as
  // screenshot 4. This points to a route "/lead-history/:id" — you need to
  // add that route in your router (App.jsx / wherever your <Routes> live)
  // pointing to the new LeadProfileHistory component given separately below.
  const openHistory = (lead) => {
    window.open(`/lead-history/${lead.id}`, "_blank");
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

  // Client-side search — filters by Name / Email / Mobile, matches the "Search Customers" bar style
  const filteredLeads = leads.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.lead_name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.contact_number?.toLowerCase().includes(q)
    );
  });

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
        <TextField
          size="small"
          placeholder="Search Name / Email / Mobile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

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
          Total Number of Records - {filteredLeads.length}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
  component={Paper}
  elevation={0}
  sx={{
    borderRadius: 2,
    boxShadow: "none",
    border: "1px solid #e0e0e0",
  }}
>
          <Table
  size="small"
  stickyHeader
  sx={{
    tableLayout: "fixed",
    borderCollapse: "separate",
    borderSpacing: 0,
   "& .MuiTableCell-root": {
  borderRight: "1px solid #c4c4c4",
  borderBottom: "1px solid #c4c4c4",
}
  }}
>
           <TableHead
  sx={{
    bgcolor: "#f5f5f5",
    borderBottom: "1px solid #bdbdbd",
    "& th": {
      borderTop: "none",
    },
  }}
>
  <TableRow>
    <TableCell
      padding="checkbox"
      sx={{
        position: "sticky",
        left: STICKY_COL.checkbox.left,
        zIndex: 3,
        bgcolor: "#f5f5f5",
        borderBottom: "none",
      }}
    >
                  <Checkbox
                    checked={filteredLeads.length > 0 && selectedIds.length === filteredLeads.length}
                    onChange={toggleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", position: "sticky", left: STICKY_COL.created.left, width: STICKY_COL.created.width, zIndex: 3, bgcolor: "#f5f5f5", borderRight: "1px solid #c4c4c4" }}>Created - Updated</TableCell>

<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", position: "sticky", left: STICKY_COL.name.left, width: STICKY_COL.name.width, zIndex: 3, bgcolor: "#f5f5f5", borderRight: "1px solid #c4c4c4" }}>Name</TableCell>

<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", position: "sticky", left: STICKY_COL.mobile.left, width: STICKY_COL.mobile.width, zIndex: 3, bgcolor: "#f5f5f5", borderRight: "1px solid #c4c4c4" }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 260, pl: 3 }}>Email</TableCell>
                <TableCell
  sx={{
    fontWeight: 700,
    whiteSpace: "nowrap",
    width: 160,
    pl: 2,
  }}
>
  Interested Country
</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 140 }}>Service Type</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 120 }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 160 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 120 }}>Assigned By</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 120 }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 230 }}>Review</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 100 }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 160 }}>Last Remark</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No enquiries found. Click "+ Add Enquiry" to create one.
                  </TableCell>
                </TableRow>
              )}
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id} sx={{ bgcolor: statusRowColor(lead.status) }}>
                  <TableCell
                    padding="checkbox"
                    sx={{ position: "sticky", left: STICKY_COL.checkbox.left, zIndex: 1, bgcolor: statusRowColor(lead.status) }}
                  >
                    <Checkbox
                      checked={selectedIds.includes(lead.id)}
                      onChange={() => toggleSelect(lead.id)}
                    />
                  </TableCell>
                 <TableCell
  
  sx={{
    position: "sticky",
    left: STICKY_COL.created.left,
    width: STICKY_COL.created.width,
    zIndex: 1,
    bgcolor: statusRowColor(lead.status),
    lineHeight: 1.8,
    borderRight: "1px solid #c4c4c4",
  }}
>
  <Typography variant="body2">
    {lead.created_at
      ? new Date(lead.created_at).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "—"}
  </Typography>

  <Typography variant="body2" color="text.secondary">
    {lead.updated_at
      ? new Date(lead.updated_at).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "—"}
  </Typography>
</TableCell>
<TableCell
  sx={{
    position: "sticky",
    left: STICKY_COL.name.left,
    width: STICKY_COL.name.width,
    zIndex: 1,
    bgcolor: statusRowColor(lead.status),
    whiteSpace: "nowrap",
    borderRight: "1px solid #c4c4c4",
  }}
>
  {lead.lead_name}
</TableCell>                 
<TableCell
  sx={{
    position: "sticky",
    left: STICKY_COL.mobile.left,
    width: STICKY_COL.mobile.width,
    zIndex: 1,
    bgcolor: statusRowColor(lead.status),
    whiteSpace: "nowrap",
    borderRight: "1px solid #c4c4c4",
  }}
>
  {lead.contact_number}
</TableCell>
                  <TableCell
  sx={{
    pl: 3,
    width: 260,
    whiteSpace: "nowrap",
  }}
>
  {lead.email || "—"}
</TableCell>
                  <TableCell sx={{ pl: 2 }}>
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
                  <TableCell>{lead.assigned_by_name || "—"}</TableCell>
                  <TableCell>{lead.assigned_to_name || "Not Assigned"}</TableCell>
                  <TableCell>
                    <Stack
  direction="row"
  spacing={0.5}
  alignItems="center"
>
                      <Button
  size="small"
  variant="outlined"
  startIcon={<HistoryIcon fontSize="small" />}
  onClick={() => openHistory(lead)}
  sx={{
    textTransform: "none",
    height: 32,
    minWidth: "auto",
    px: 1,
    borderRadius: 1,
  }}
>
  History
</Button>
                      {/* Assumption: backend GET /leads should also return
                          notes_count per lead. Falls back to 0 if missing. */}
                      <Button
  size="small"
  variant="outlined"
  startIcon={<StickyNote2Icon fontSize="small" />}
  onClick={() => {
    setNotesLead(lead);
    setNotesOpen(true);
  }}
  sx={{
    textTransform: "none",
    minWidth: "auto",
    px: 1,
    height: 32,
    borderRadius: 1,
    display: "flex",
    alignItems: "center",
    gap: 0.5,
  }}
>
  <span>Notes</span>

  <Box
    sx={{
      width: 16,
      height: 16,
      borderRadius: "3px",
      bgcolor: "#1a2472",
      color: "#fff",
      fontSize: "10px",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
    }}
  >
    {lead.notes_count || 0}
  </Box>
</Button>
                    </Stack>
                  </TableCell>
                  <TableCell>{lead.branch || "—"}</TableCell>
                  {/* No remarks/comments system exists in the backend yet — this
                      column is a placeholder so the layout matches the reference.
                      Tell me if you want a real "Add Remark" feature built
                      (needs a small new table + API, not wired up yet). */}
                  <TableCell>{lead.last_remark || "—"}</TableCell>
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

      <NotesDialog
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        lead={notesLead}
        onSaved={fetchLeads}
      />
    </Box>
  );
}

export default LeadManagement;