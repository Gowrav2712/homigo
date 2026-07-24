import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Collapse,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Rating,
  Avatar,
} from "@mui/material";
import {
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Star,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import ChatModal from "./ChatModal";
import ReviewModal from "./ReviewModal";

const getServiceImage = (serviceName, imageSrc) => {
  if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '' && imageSrc !== 'null') {
    return imageSrc;
  }
  const nameMap = {
    'Appliance Repair': '/service_images/appliance_repair.png',
    'Home Cleaning': '/service_images/home_cleaning.png',
    'CCTV Install': '/service_images/cctv_install.png',
    'Carpenter': '/service_images/carpenter.png',
    'Electricians': '/service_images/electricians.png',
    'WiFi Install': '/service_images/wifi_install.png',
    'Painter': '/service_images/painter.png',
    'Packers and Movers': '/service_images/packers_movers.png',
    'Plumber': '/service_images/plumber.png',
  };
  return nameMap[serviceName] || '/service_images/appliance_repair.png';
};

const OrderCard = ({ order, onOrderUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const toggleOrderExpand = () => {
    setExpanded(!expanded);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#FFA500";
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#F44336";
      case "accepted":
        return "#42a7f5";
      case "rejected":
        return "#d742f5";
      default:
        return "#757575";
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock size={16} />;
      case "completed":
        return <CheckCircle size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
      case "accepted":
        return <Truck size={16} />;
      case "rejected":
        return <AlertTriangle size={16} />;
      default:
        return null;
    }
  };

  const handleCancelOrder = async () => {
    // Check if order is in a cancellable state
    if (!["pending", "accepted"].includes(order.status.toLowerCase())) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/orders/${order.id}/status/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "cancelled" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }

      const updatedOrder = await response.json();

      // If onOrderUpdate callback is provided, call it to update parent component
      if (onOrderUpdate) {
        onOrderUpdate(updatedOrder);
      }

      // Close the dialog
      setCancelDialogOpen(false);
    } catch (error) {
      console.error("Error cancelling order:", error);
      // Optionally show an error message to the user
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (orderId, rating, reviewText) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/orders/${orderId}/review/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: rating,
            review: reviewText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      const updatedOrder = await response.json();

      if (onOrderUpdate) {
        onOrderUpdate(updatedOrder);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      // Optionally show an error message to the user
    }
  };

  return (
    <Grid item xs={12}>
      <Card elevation={3}>
        <CardContent>
          {/* Order Id and status */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle1">
              Order ID: {order.id.slice(0, 8)}
            </Typography>
            <Chip
              icon={getStatusIcon(order.status)}
              label={order.status.toUpperCase()}
              sx={{
                backgroundColor: getStatusColor(order.status),
                color: "white",
              }}
            />
          </Box>

          {/* Order Details */}
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: { xs: "flex-start", sm: "center" } }}>
            <Box
              component="img"
              src={getServiceImage(order.service_name, order.service_image)}
              alt={order.service_name}
              sx={{
                width: 90,
                height: 90,
                objectFit: "cover",
                borderRadius: 2,
                bgcolor: 'grey.100',
              }}
            />

            <Box flex={1}>
              <Box display="flex" alignItems="center" flexWrap="wrap" gap={1.5} mb={0.5}>
                <Typography variant="h6" fontWeight={600} color="primary">
                  {order.service_name}
                </Typography>

                {/* Provider Name Chip & Chat Button next to service title */}
                {order.provider_name && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      icon={<User size={14} color="#1976d2" />}
                      label={order.provider_name}
                      variant="outlined"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProviderModalOpen(true);
                      }}
                      sx={{
                        fontWeight: 600,
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        borderColor: 'primary.light',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(25, 118, 210, 0.18)',
                          transform: 'scale(1.02)',
                        }
                      }}
                    />
                    {(order.status?.toLowerCase() === "accepted" || order.status?.toLowerCase() === "pending") && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatOpen(true);
                        }}
                        sx={{
                          height: "1.8rem",
                          px: 2,
                          borderRadius: "12px",
                          bgcolor: "success.main",
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          "&:hover": { bgcolor: "success.dark" },
                        }}
                      >
                        Chat
                      </Button>
                    )}
                  </Box>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <Calendar size={15} />
                <Typography variant="body2" color="text.secondary">
                  Ordered: {new Date(order.ordered_on).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <Truck size={15} />
                <Typography variant="body2" color="text.secondary">
                  Scheduled: {new Date(order.scheduled_on).toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: { xs: "left", sm: "right" }, width: { xs: "100%", sm: "auto" } }}>
              <Typography variant="h6" color="primary">
                ₹{parseFloat(order.total_price).toLocaleString("en-IN")}
              </Typography>
            </Box>
          </Box>

          {/* Expand/Collapse Button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <IconButton onClick={toggleOrderExpand} size="small">
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </IconButton>
          </Box>

          {/* Expandable Details Section */}
          <Collapse in={expanded}>
            <Box
              sx={{
                mt: 2,
                p: 3,
                bgcolor: "white",
                borderRadius: 3,
                boxShadow: 2,
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              {/* Provider & OTP Section */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      bgcolor: "rgba(0,0,0,0.04)",
                      p: 2,
                      borderRadius: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Service Provider
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {order.provider_name}
                      </Typography>
                    </Box>
                    {(order.status === "accepted" ||
                      order.status === "pending") && (
                      <Button
                        variant="contained"
                        onClick={() => setChatOpen(true)}
                        sx={{
                          height: "2rem",
                          padding: "0 15px",
                          borderRadius: "15px",
                          bgcolor: "success.main",
                          "&:hover": { bgcolor: "success.dark" },
                        }}
                      >
                        Chat
                      </Button>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  {/* OTP or Review Section */}
                  {order.status.toLowerCase() !== "completed" ? (
                    <Box
                      sx={{
                        bgcolor: "rgba(0,0,0,0.04)",
                        p: 2,
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Verification OTP
                      </Typography>
                      <Typography variant="h6" color="primary" fontWeight={600}>
                        {order.otp}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Share with service provider
                      </Typography>
                    </Box>
                  ) : order.rating && order.review ? (
                    <Box
                      sx={{
                        bgcolor: "rgba(0,0,0,0.04)",
                        p: 2,
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Your Review
                      </Typography>
                      <Rating
                        value={order.rating}
                        readOnly
                        precision={1}
                        icon={<Star fill="currentColor" />}
                        emptyIcon={<Star />}
                        sx={{
                          "& .MuiRating-iconFilled": {
                            color: "primary.main",
                          },
                        }}
                      />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {order.review}
                      </Typography>
                    </Box>
                  ) : null}
                </Grid>
              </Grid>

              {/* Sub Services */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Service Details
                </Typography>
                {order.items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: "rgba(0,0,0,0.02)",
                      p: 1.5,
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      • {item.sub_service_name}
                    </Typography>
                    <Chip
                      label={`₹${parseFloat(item.price).toLocaleString(
                        "en-IN"
                      )}`}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                ))}
              </Box>

              {/* Scheduling Details */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: 'wrap',
                  gap: 2,
                  borderTop: "1px solid rgba(0,0,0,0.1)",
                  pt: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Ordered On
                  </Typography>
                  <Typography variant="body2">
                    {new Date(order.ordered_on).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Scheduled On
                  </Typography>
                  <Typography variant="body2">
                    {new Date(order.scheduled_on).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Price
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    ₹{parseFloat(order.total_price).toLocaleString("en-IN")}
                  </Typography>
                </Box>
              </Box>
              {/* Cancel Order Option */}
              {["pending", "accepted"].includes(order.status.toLowerCase()) && (
                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    justifyContent: "center",
                    borderTop: "1px solid rgba(0,0,0,0.1)",
                    pt: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<X size={16} />}
                    onClick={() => setCancelDialogOpen(true)}
                    sx={{
                      borderRadius: 3,
                    }}
                  >
                    Cancel Order
                  </Button>
                </Box>
              )}
              {order.status.toLowerCase() === "completed" && (!order.rating || !order.review) && (
                <Box 
                  sx={{ 
                    mt: 3, 
                    display: 'flex', 
                    justifyContent: 'center',
                    borderTop: '1px solid rgba(0,0,0,0.1)',
                    pt: 2 
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setReviewModalOpen(true)}
                    sx={{
                      borderRadius: 3,
                    }}
                  >
                    Write a Review
                  </Button>
                </Box>
              )}
            </Box>

            <ChatModal
              open={chatOpen}
              onClose={() => setChatOpen(false)}
              orderId={order.id}
              providerId={order.provider}
              providerName={order.provider_name}
              clientId={localStorage.getItem("userId")}
              clientName={localStorage.getItem("userName")}
            />
            <ReviewModal
              open={reviewModalOpen}
              onClose={() => setReviewModalOpen(false)}
              orderId={order.id}
              providerName={order.provider_name}
              onSubmitReview={handleSubmitReview}
            />
          </Collapse>
        </CardContent>
      </Card>
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        aria-labelledby="cancel-order-dialog-title"
        aria-describedby="cancel-order-dialog-description"
      >
        <DialogTitle id="cancel-order-dialog-title">Cancel Order</DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-order-dialog-description">
            Are you sure you want to cancel this order? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} color="primary">
            No, Keep Order
          </Button>
          <Button
            onClick={handleCancelOrder}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? "Cancelling..." : "Yes, Cancel Order"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Provider Contact & Details Modal */}
      <Dialog
        open={providerModalOpen}
        onClose={() => setProviderModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight={700} color="primary">
            Service Provider Details
          </Typography>
          <IconButton onClick={() => setProviderModalOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", mb: 3 }}>
            <Avatar
              sx={{ width: 70, height: 70, bgcolor: "primary.main", fontSize: "1.8rem", mb: 1.5, boxShadow: 2 }}
            >
              {order.provider_name ? order.provider_name.charAt(0).toUpperCase() : "P"}
            </Avatar>
            <Typography variant="h6" fontWeight={700}>
              {order.provider_name || "Assigned Provider"}
            </Typography>
            <Chip
              label={order.service_name || "Service Professional"}
              color="primary"
              size="small"
              sx={{ mt: 0.5, fontWeight: 500 }}
            />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 2 }}>
              <Phone color="#1976d2" size={20} />
              <Box textAlign="left">
                <Typography variant="caption" color="text.secondary">
                  Contact Number
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {order.provider_mobile || "+91 9876543210"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 2 }}>
              <MapPin color="#1976d2" size={20} />
              <Box textAlign="left">
                <Typography variant="caption" color="text.secondary">
                  Address / Location
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {order.provider_address || "Mysore, Karnataka"}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Phone size={18} />}
            fullWidth
            component="a"
            href={`tel:${order.provider_mobile || "9876543210"}`}
            sx={{ borderRadius: 2.5, py: 1.2, textTransform: "none", fontWeight: 600, fontSize: "0.95rem" }}
          >
            Call Provider
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default OrderCard;
