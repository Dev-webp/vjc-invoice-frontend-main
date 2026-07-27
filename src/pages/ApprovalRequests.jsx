import { useState, useEffect } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, Chip, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from "@mui/material";

const API = "https://vjc-invoice-backend-main.vercel.app/api";
const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

function ApprovalRequests() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("vjc_invoice_auth");
      const res = await fetch(`${API}/invoices/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices || []);
      } else {
        setError(data.message || "Failed to load pending invoices");
      }
    } catch (err) {
      setError("Unable to connect to backend server!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("vjc_invoice_auth");
      const res = await fetch(`${API}/invoices/${id}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert(action === "approve" ? "✅ Invoice approved! Client mail sent." : "❌ Invoice rejected.");
        fetchPending();
      } else {
        alert("❌ Error: " + data.message);
      }
    } catch (err) {
      alert("❌ Action failed");
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Approval Requests
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell><strong>Invoice #</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Service Type</strong></TableCell>
              <TableCell><strong>Grand Total</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No pending invoices for approval.
                </TableCell>
              </TableRow>
            ) : invoices.map((inv) => (
              <TableRow key={inv.id} hover>
                <TableCell sx={{ color: "#1976d2", fontWeight: "bold" }}>{inv.invoice_number}</TableCell>
                <TableCell>{inv.customer_name}</TableCell>
                <TableCell>{inv.service_type || "—"}</TableCell>
                <TableCell><strong>{fmt(inv.grand_total)}</strong></TableCell>
                <TableCell><Chip label="Pending" color="warning" size="small" /></TableCell>
                <TableCell>
                  <Button
                    size="small" color="success" variant="contained" sx={{ mr: 1 }}
                    disabled={actionLoading === inv.id}
                    onClick={() => setConfirmDialog({ id: inv.id, action: "approve", invoiceNo: inv.invoice_number })}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small" color="error" variant="outlined"
                    disabled={actionLoading === inv.id}
                    onClick={() => setConfirmDialog({ id: inv.id, action: "reject", invoiceNo: inv.invoice_number })}
                  >
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>
          {confirmDialog?.action === "approve" ? "Approve Invoice?" : "Reject Invoice?"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog?.action === "approve"
              ? `Approve invoice ${confirmDialog?.invoiceNo}? Client will receive the invoice by email.`
              : `Reject invoice ${confirmDialog?.invoiceNo}? This cannot be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmDialog?.action === "approve" ? "success" : "error"}
            onClick={() => handleAction(confirmDialog.id, confirmDialog.action)}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ApprovalRequests;