import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, IconButton, Badge, Paper, Typography, Button } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import InventoryIcon from "@mui/icons-material/Inventory";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PaymentsIcon from "@mui/icons-material/Payments";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BadgeIcon from "@mui/icons-material/Badge";
import LogoutIcon from "@mui/icons-material/Logout";
import vjcLogo from "../assets/vjc-logo-badge.png";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";

const API = "https://invoice.vjcoverseas.com/api";
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("vjc_invoice_auth")}`,
});

// Plays a short beep using the Web Audio API (no external audio file needed)
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beepTimes = [0, 0.3, 0.6];
    beepTimes.forEach((startOffset) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 880;
      const startTime = ctx.currentTime + startOffset;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.25);
    });
  } catch {
    // silent — some browsers block audio without a prior user gesture
  }
};

// ── App-wide Lead Assignment Notifier — polls every 5s from ANY page ─────
function AssignmentNotifier() {
  const [assignments, setAssignments] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [permissionState, setPermissionState] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const enableNotifications = () => {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then((result) => {
      setPermissionState(result);
    });
  };

  const fetchNew = async () => {
    try {
      const res = await fetch(`${API}/leads/assignments/new`, { headers: authHeader() });
      const data = await res.json();
      if (!data.success) return;
      const newOnes = data.assignments || [];

      newOnes.forEach((a) => {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("New Lead Assigned", {
            body: `${a.lead_name} has been assigned to you.`,
          });
          playNotificationSound();
        }
        fetch(`${API}/leads/assignments/${a.history_id}/notified`, {
          method: "PUT",
          headers: authHeader(),
        }).catch(() => {});
      });

      if (newOnes.length > 0) {
        setAssignments((prev) => [...newOnes, ...prev].slice(0, 20));
        setUnseenCount((prev) => prev + newOnes.length);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchNew();
    const interval = setInterval(fetchNew, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      {permissionState === "default" && (
        <Button
          size="small"
          variant="outlined"
          onClick={enableNotifications}
          sx={{ textTransform: "none", color: "#fff", borderColor: "rgba(255,255,255,0.3)", fontSize: 12 }}
        >
          🔔 Enable Notifications
        </Button>
      )}
      <IconButton
        onClick={() => {
          setOpen(!open);
          if (!open) setUnseenCount(0);
        }}
        sx={{ color: "#fff" }}
      >
        <Badge badgeContent={unseenCount} color="primary">
          <AssignmentIndIcon />
        </Badge>
      </IconButton>

      {open && (
        <Paper
          elevation={4}
          sx={{
            position: "absolute", left: 0, top: 44, width: 300, zIndex: 2000,
            maxHeight: 360, overflowY: "auto", borderRadius: 2,
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #eee" }}>
            <Typography variant="subtitle2" fontWeight={700}>Lead Assignments</Typography>
          </Box>
          {assignments.length === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">No new assignments.</Typography>
            </Box>
          )}
          {assignments.map((a) => (
            <Box key={a.history_id} sx={{ px: 2, py: 1.5, borderBottom: "1px solid #f0f0f0" }}>
              <Typography variant="body2" fontWeight={600}>{a.lead_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Assigned {a.assigned_date ? new Date(a.assigned_date).toLocaleString("en-GB") : ""}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}
const Sidebar = ({ setPage, activePage }) => {
  const navigate = useNavigate();
   const user = JSON.parse(
    localStorage.getItem("vjc_invoice_user")
  );
console.log("Logged User =", user);
  const menuItems =
  (user?.role === "chairman" || user?.role === "mis-executive")
    ? [
        { name: "Dashboard", icon: <DashboardIcon /> },
        { name: "Leads", icon: <PersonSearchIcon /> },
        { name: "Customers", icon: <PeopleIcon /> },
        { name: "Services", icon: <InventoryIcon /> },
        { name: "Proforma Invoice", icon: <RequestQuoteIcon /> },
       { name: "Approval Requests", icon: <FactCheckIcon /> },
        { name: "Approved Invoices", icon: <ReceiptLongIcon /> },
        { name: "Rejected Invoices", icon: <HighlightOffIcon /> },
        { name: "Payments Received", icon: <PaymentsIcon /> },
        { name: "Expenses", icon: <AccountBalanceWalletIcon /> },
{ name: "Reports", icon: <AssessmentIcon /> },
{ name: "All Employees", icon: <PeopleIcon /> },
        { name: "Add Employee", icon: <BadgeIcon /> },
      ]
    : [
        { name: "Dashboard", icon: <DashboardIcon /> },
        { name: "Leads", icon: <PersonSearchIcon /> },
        { name: "Customers", icon: <PeopleIcon /> },
        { name: "Services", icon: <InventoryIcon /> },
        { name: "Proforma Invoice", icon: <RequestQuoteIcon /> },
        { name: "Approved Invoices", icon: <ReceiptLongIcon /> },
        { name: "Payments Received", icon: <PaymentsIcon /> },
        { name: "Reports", icon: <AssessmentIcon /> },
      ];
      const nameToPermKey = {
    "Dashboard": "dashboard",
     "Leads": "leads",
    "Customers": "customers",
    "Services": "services",
    "Proforma Invoice": "quotes",
      "Approval Requests": "invoices",
    "Approved Invoices": "invoices",
      "Rejected Invoices": "invoices",
    "Payments Received": "payments",
    "Reports": "reports",
  };

const finalMenuItems =
    (user?.role === "chairman" || user?.role === "mis-executive")
      ? menuItems
      : menuItems.filter((item) => user?.permissions?.[nameToPermKey[item.name]]);

  const handleLogout = () => {
    localStorage.removeItem("vjc_invoice_auth");
    navigate("/login");
  };

  return (
    <div
      style={{
        width: "290px",
        height: "100vh",
               background: "#164A87",
        color: "white",
        padding: "20px",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
               <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" }}>
        <img src={vjcLogo} alt="VJC" style={{ width: "220px", height: "auto", objectFit: "contain" }} />
                <span style={{ fontSize: "13px", letterSpacing: "3px", color: "#ffffff", fontWeight: 700, marginTop: "10px", textTransform: "uppercase" }}>
          INVOICE PORTAL
        </span>
      </div>
      <AssignmentNotifier />

      <div style={{ flex: 1 }}>
        {finalMenuItems.map((item, index) => (
          <div
            key={item.name}
            onClick={() => setPage(item.name)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px",
              marginBottom: "10px",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "0.3s",
              background:
                activePage === item.name
                  ? "#F5820C"
                  : index === 0 && !activePage
                  ? "#F5820C"
                  : "transparent",
            }}
            onMouseEnter={(e) => {
              if (activePage !== item.name) {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== item.name) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {item.icon}
            <span style={{ fontSize: "18px", whiteSpace: "nowrap" }}>
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {/* Logout Button - bottom lo */}
      <div
        onClick={handleLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "14px",
          marginTop: "10px",
          borderRadius: "10px",
          cursor: "pointer",
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.25)",
          color: "#f87171",
          transition: "0.3s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.22)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.12)";
        }}
      >
        <LogoutIcon />
        <span style={{ fontSize: "18px", whiteSpace: "nowrap" }}>Logout</span>
      </div>
    </div>
  );
};

export default Sidebar;
