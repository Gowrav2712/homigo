import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import {
  Box,
  Typography,
  Chip,
  Grid,
  Paper,
  Container,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
} from "@mui/material";
import {
  FilterList as FilterIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  ThumbUp as AcceptedIcon,
  Cancel as CancelledIcon,
  Block as RejectedIcon,
  Apps as AllIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";

import OrderCard from "./OrderCard";

const statusOptions = [
  { value: "all", label: "All Orders", icon: <AllIcon fontSize="small" /> },
  { value: "pending", label: "Pending", icon: <PendingIcon fontSize="small" /> },
  { value: "accepted", label: "Accepted", icon: <AcceptedIcon fontSize="small" /> },
  { value: "completed", label: "Completed", icon: <CompletedIcon fontSize="small" /> },
  { value: "rejected", label: "Rejected", icon: <RejectedIcon fontSize="small" /> },
  { value: "cancelled", label: "Cancelled", icon: <CancelledIcon fontSize="small" /> },
];

const timeOptions = [
  { value: "all", label: "All Time" },
  { value: "lastWeek", label: "Last 7 Days" },
  { value: "lastMonth", label: "Last 30 Days" },
];

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem("userId");

        if (!userId) {
          throw new Error("User ID not found in localStorage");
        }

        const response = await fetch(
          `${API_BASE_URL}/orders?client_id=${userId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();

        // Sort orders by date descending (newest first)
        const sortedOrders = data.sort(
          (a, b) => new Date(b.ordered_on) - new Date(a.ordered_on)
        );

        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    let result = [...orders];

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter(
        (order) => order.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Time Filter
    const now = new Date();
    if (timeFilter === "lastWeek") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter((order) => new Date(order.ordered_on) >= weekAgo);
    } else if (timeFilter === "lastMonth") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter((order) => new Date(order.ordered_on) >= monthAgo);
    }

    setFilteredOrders(result);
  }, [statusFilter, timeFilter, orders]);

  const handleOrderUpdate = (updatedOrder) => {
    const updatedOrders = orders.map((order) =>
      order.id === updatedOrder.id ? updatedOrder : order
    );
    setOrders(updatedOrders);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header Banner */}
      <Box
        sx={{
          mb: 3,
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "white",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
          display: "flex",
          alignItems: "center",
          justify: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} letterSpacing="-0.5px">
            My Orders
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            Track and manage your service requests
          </Typography>
        </Box>
        <Chip
          label={`${filteredOrders.length} ${filteredOrders.length === 1 ? "Order" : "Orders"}`}
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.15)",
            color: "white",
            fontWeight: 700,
            backdropFilter: "blur(10px)",
            px: 1,
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Filters Panel */}
        <Grid item xs={12} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            {/* Status Section Header */}
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <FilterIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                Filter by Status
              </Typography>
            </Box>

            {/* Horizontal Scroll Chips on Mobile, Vertical Stack on Desktop */}
            <Stack
              direction={isMobile ? "row" : "column"}
              spacing={1}
              sx={{
                overflowX: isMobile ? "auto" : "visible",
                pb: isMobile ? 1 : 0,
                mb: isMobile ? 2 : 3,
                WebkitOverflowScrolling: "touch",
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
              }}
            >
              {statusOptions.map((option) => {
                const isSelected = statusFilter === option.value;
                return (
                  <Chip
                    key={option.value}
                    icon={option.icon}
                    label={option.label}
                    onClick={() => setStatusFilter(option.value)}
                    variant={isSelected ? "filled" : "outlined"}
                    color={isSelected ? "primary" : "default"}
                    clickable
                    sx={{
                      fontWeight: isSelected ? 700 : 500,
                      py: 2.2,
                      px: 1,
                      borderRadius: "12px",
                      justifyContent: isMobile ? "center" : "flex-start",
                      transition: "all 0.2s ease-in-out",
                      flexShrink: 0,
                      boxShadow: isSelected
                        ? "0 4px 12px rgba(25, 118, 210, 0.3)"
                        : "none",
                      "& .MuiChip-icon": {
                        color: isSelected ? "inherit" : theme.palette.text.secondary,
                      },
                    }}
                  />
                );
              })}
            </Stack>

            <Divider sx={{ my: isMobile ? 1.5 : 2 }} />

            {/* Time Filter Section */}
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <CalendarIcon color="primary" fontSize="small" />
              <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                Time Period
              </Typography>
            </Box>

            <Stack
              direction={isMobile ? "row" : "column"}
              spacing={1}
              sx={{
                overflowX: isMobile ? "auto" : "visible",
                pb: isMobile ? 0.5 : 0,
                WebkitOverflowScrolling: "touch",
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
              }}
            >
              {timeOptions.map((option) => {
                const isSelected = timeFilter === option.value;
                return (
                  <Chip
                    key={option.value}
                    label={option.label}
                    onClick={() => setTimeFilter(option.value)}
                    variant={isSelected ? "filled" : "outlined"}
                    color={isSelected ? "secondary" : "default"}
                    clickable
                    sx={{
                      fontWeight: isSelected ? 700 : 500,
                      py: 2,
                      px: 1,
                      borderRadius: "12px",
                      justifyContent: isMobile ? "center" : "flex-start",
                      flexShrink: 0,
                      transition: "all 0.2s ease-in-out",
                    }}
                  />
                );
              })}
            </Stack>
          </Paper>
        </Grid>

        {/* Orders Grid */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            {filteredOrders.map((order) => (
              <Grid item xs={12} key={order.id}>
                <OrderCard order={order} onOrderUpdate={handleOrderUpdate} />
              </Grid>
            ))}

            {filteredOrders.length === 0 && (
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 4, md: 6 },
                    textAlign: "center",
                    borderRadius: 3,
                    border: "1px dashed",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography variant="h6" fontWeight={600} color="text.secondary" gutterBottom>
                    No orders found
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Try changing your status or time filters above.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrdersList;
