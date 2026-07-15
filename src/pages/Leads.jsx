import { Box, Typography, Paper } from "@mui/material";

const Leads = () => {
  return (
    <Box>
      <Typography
        variant="h4"
        fontWeight="700"
        sx={{ mb: 3, color: "#111827" }}
      >
        Lead Management
      </Typography>

      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 3,
          textAlign: "center",
          minHeight: "300px",
        }}
      >
        <Typography variant="h6" color="text.secondary">
          🚀 Leads Module Coming Soon
        </Typography>

        <Typography sx={{ mt: 2 }} color="text.secondary">
          Here you can manage leads from Facebook, Instagram, Website,
          Google Ads and assign them to BDMs.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Leads;