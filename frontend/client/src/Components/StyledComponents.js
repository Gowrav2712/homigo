import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Rating,
  Popover,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Stack,
  Backdrop,
  Avatar,
  CardMedia,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Chip,
} from "@mui/material";

import {
  Clock,
  Calendar,
  Star,
  MapPin,
  ChevronRight,
  Phone,
  Bike,
  X,
  Check,
} from "lucide-react";

import { motion } from "framer-motion";
// import { Star, MapPin, Clock, ChevronRight, Phone, Bike , X} from "lucide-react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
// import { Calendar, Check } from "lucide-react";
import Spashscreen from "../pages/Spashscreen";
import { useWelcomeViewContext } from "../Contexts/WelcomeViewContextProvider";

export const ServiceProviderImage = ({ provider, providerName }) => {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);
  const initials = providerName ? providerName.charAt(0).toUpperCase() : "P";

  return (
    <Box position="relative">
      <Avatar
        src={!imageError && provider?.provider_photo ? provider.provider_photo : undefined}
        alt={providerName}
        sx={{
          width: 64,
          height: 64,
          border: `2px solid ${theme.palette.primary.main}`,
          boxShadow: theme.shadows[3],
          bgcolor: theme.palette.primary.main,
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "1.5rem",
        }}
        onError={() => setImageError(true)}
      >
        {initials}
      </Avatar>
    </Box>
  );
};

const formatDistance = (dist) => {
  if (dist === null || dist === undefined || isNaN(dist)) {
    return "1.5 KM away";
  }
  const num = parseFloat(dist);
  if (num <= 0) {
    return "< 1 KM away";
  }
  return `${num.toFixed(1)} KM away`;
};

export const ServiceProviderCard = ({ provider, index }) => {
  const theme = useTheme();
  const { isLoggedIn, handleOpenAuthModal } = useWelcomeViewContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showSuccessSplash, setShowSuccessSplash] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  //const [orderCompleted, setOrderCompleted] = useState(false);

  const handleBookNowClick = (event) => {
    if (!isLoggedIn) {
      handleOpenAuthModal();
      return;
    }
    setAnchorEl(event.currentTarget);
    setSelectedServices([]);
    fetchAvailableServices();
  };

  const createOrder = async () => {
    const userId = localStorage.getItem("userId");
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(selectedTime.getHours());
    scheduledDateTime.setMinutes(selectedTime.getMinutes());
    const serviceId = window.location.pathname.split("/").pop();
    const { latitude: client_latitude, longitude: client_longitude } =
      JSON.parse(localStorage.getItem("userLocation") || "{}") || {};

    const orderData = {
      user: userId,
      provider: provider.provider_id,
      service: serviceId,
      scheduled_on: scheduledDateTime.toISOString(),
      total_price: calculateTotal(),
      client_latitude: parseFloat(client_latitude).toFixed(6),
      client_longitude: parseFloat(client_longitude).toFixed(6),
      items: selectedServices.map((service) => ({
        provider_service: service.id,
      })),
    };

    try {
      console.log(orderData);
      const response = await fetch(`http://127.0.0.1:8000/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      setAnchorEl(null);
      setShowOrderSummary(false);
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedServices([]);

      // Use a small timeout to ensure state updates are processed
      setTimeout(() => {
        setShowSuccessSplash(true);
      }, 100);
    } catch (error) {
      console.error("Error creating order:", error);
      // You might want to add error handling UI here
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/service_providers/provider_services/?provider_id=${provider.provider_id}`
      );
      const data = await response.json();
      // Create a Set of IDs to avoid duplicates
      const seenIds = new Set();
      const uniqueServices = [
        // Only add the main service if it's not in the fetched data
        ...(data.some((service) => service.id === provider.id)
          ? []
          : [
              {
                id: provider.id,
                sub_service_name: provider.service_name,
                price: provider.price,
              },
            ]),
        ...data.filter((service) => {
          if (seenIds.has(service.id)) {
            return false;
          }
          seenIds.add(service.id);
          return true;
        }),
      ];
      setAvailableServices(uniqueServices);
    } catch (error) {
      console.error("Error fetching available services:", error);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setShowOrderSummary(false);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedServices([]);
  };

  const handleServiceToggle = (service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const calculateTotal = () => {
    return selectedServices.reduce(
      (sum, service) => sum + parseFloat(service.price),
      0
    );
  };

  const handleScheduleBook = () => {
    if (selectedDate && selectedTime) {
      setShowOrderSummary(true);
    }
  };

  const open = Boolean(anchorEl);

  const ReviewsDialog = ({ open, onClose, provider }) => {
    const theme = useTheme();
    const totalReviews = provider.provider_reviews?.length || 0;

    const getReviewCountPercentage = (count, total) => {
      if (!total) return 0;
      return (count / total) * 100;
    };

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
          },
        }}
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h5" fontWeight={600}>
              {totalReviews} Reviews
            </Typography>
            <IconButton onClick={onClose}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h4" gutterBottom>
               {provider.provider_rating?.toFixed(2)} / 5
            </Typography>

            {[5, 4, 3, 2, 1].map((rating) => (
              <Box
                key={rating}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 1,
                }}
              >
                <Typography sx={{ minWidth: 30 }}>{rating}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={getReviewCountPercentage(
                    provider.rating_counts?.[rating] || 0,
                    totalReviews
                  )}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: theme.palette.grey[200],
                    "& .MuiLinearProgress-bar": {
                      bgcolor: theme.palette.success.main,
                    },
                  }}
                />
                <Typography sx={{ minWidth: 50 }}>
                  {provider.rating_counts?.[rating] || 0}
                </Typography>
              </Box>
            ))}

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Recent Reviews
              </Typography>
              {provider.provider_reviews?.map((review) => (
                <Box
                  key={review.order_id}
                  sx={{
                    py: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Rating value={review.rating} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                      by {review.client_name}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{review.review}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(review.date).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    );
  };

  const PartialStar = ({ value, color = "#FF9800" }) => {
    // Calculate the fill percentage (0-100)
    const percentage = Math.min(
      Math.max((value - Math.floor(value)) * 100, 0),
      100
    );

    return (
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          width: 24,
          height: 24,
        }}
      >
        {/* Empty star outline */}
        <Star
          size={24}
          stroke={color}
          fill="transparent"
          style={{ position: "absolute" }}
        />
        {/* Partially filled star using SVG clip-path */}
        <svg width="24" height="24" style={{ position: "absolute" }}>
          <defs>
            <clipPath id={`clip-${percentage}`}>
              <rect x="0" y="0" width={`${percentage}%`} height="100%" />
            </clipPath>
          </defs>
          <g clipPath={`url(#clip-${percentage})`}>
            <Star
              size={24}
              stroke={color}
              fill={color}
              style={{ display: "block" }}
            />
          </g>
        </svg>
      </Box>
    );
  };

  // Custom rating component that shows partial fills
  const PartialRating = ({ value, color = "#FF9800" }) => {
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center" }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const diff = value - star + 1;
          return (
            <Box key={star} sx={{ display: "inline-flex" }}>
              {diff >= 1 ? (
                // Full star
                <Star size={24} stroke={color} fill={color} />
              ) : diff > 0 ? (
                // Partial star
                <PartialStar value={value - Math.floor(value)} color={color} />
              ) : (
                // Empty star
                <Star size={24} stroke={color} fill="transparent" />
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        sx={{
          mb: 2,
          borderRadius: 3,
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: theme.shadows[10],
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Mobile: stack vertically. Tablet+: row */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 3 }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
            {/* Avatar */}
            <Box sx={{ flexShrink: 0 }}>
              <ServiceProviderImage
                provider={provider}
                providerName={provider.provider_name}
              />
            </Box>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                {provider.provider_name}
              </Typography>

              <Box display="flex" alignItems="center" flexWrap="wrap" gap={2} mb={1}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    cursor: "pointer",
                  }}
                  onClick={() => setReviewsOpen(true)}
                >
                  <PartialRating value={provider.provider_rating || 0} />
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={0.5} width="100%">
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                      {provider.provider_rating?.toFixed(1)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ "&:hover": { textDecoration: "underline" } }}
                    >
                      ({provider.provider_reviews?.length || 0} reviews)
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="flex-start" color="text.secondary" sx={{ maxWidth: { xs: '100%', sm: 240 } }}>
                  <MapPin size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <Typography variant="body2" ml={0.5} sx={{ wordBreak: 'break-word' }}>
                    {provider.provider_address}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" color="text.secondary">
                  <Phone size={16} />
                  <Typography variant="body2" ml={1}>
                    {provider.provider_mobile_number}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" color="text.secondary">
                  <Bike size={16} />
                  <Typography variant="body2" ml={1}>
                    {formatDistance(provider.distance)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Price + Book Now */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, alignItems: { xs: 'center', sm: 'flex-end' }, justifyContent: { xs: 'space-between', sm: 'center' }, width: { xs: '100%', sm: 'auto' }, gap: 1 }}>
              <Typography variant="h5" color="primary" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                ₹{parseFloat(provider.price || 0).toLocaleString()}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                endIcon={<ChevronRight />}
                onClick={handleBookNowClick}
                sx={{
                  borderRadius: "50px",
                  px: { xs: 2, sm: 3 },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  whiteSpace: 'nowrap',
                }}
              >
                Book Now
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <ReviewsDialog
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        provider={provider}
      />

      <Backdrop
        sx={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          zIndex: theme.zIndex.drawer + 1,
        }}
        open={open}
        onClick={handleClose}
      />

      {/* Popover for ordering services */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "center",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "center",
        }}
        sx={{
          "& .MuiPopover-paper": {
            width: "min(500px, 95vw)",
            maxHeight: "85vh",
            overflowY: "auto",
            borderRadius: 3,
            boxShadow: theme.shadows[20],
            p: { xs: 2, sm: 4 },
            position: "fixed",
            top: "50% !important",
            left: "50% !important",
            transform: "translate(-50%, -50%) !important",
          },
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <X size={20} />
        </IconButton>

        <Box>
          {!showOrderSummary ? (
            <>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: 600 }}>
                Choose services
              </Typography>

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                Available Services:
              </Typography>
              <List>
                {availableServices.map((service) => (
                  <ListItem
                    key={service.id}
                    sx={{
                      bgcolor: theme.palette.background.light,
                      borderRadius: 2,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography fontWeight={500}>
                          {service.sub_service_name}
                        </Typography>
                      }
                      secondary={`₹${parseFloat(
                        service.price
                      ).toLocaleString()}`}
                    />
                    <Checkbox
                      checked={selectedServices.some(
                        (s) => s.id === service.id
                      )}
                      onChange={() => handleServiceToggle(service)}
                      sx={{
                        color: theme.palette.primary.main,
                        "&.Mui-checked": {
                          color: theme.palette.primary.main,
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={3}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: theme.palette.primary.main }}
                >
                  Total: ₹{calculateTotal().toLocaleString()}
                </Typography>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Stack spacing={2}>
                    <DatePicker
                      label="Select Date"
                      value={selectedDate}
                      onChange={setSelectedDate}
                      minDate={new Date()}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover": {
                            "& > fieldset": {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        },
                      }}
                    />
                    <TimePicker
                      label="Select Time"
                      value={selectedTime}
                      onChange={setSelectedTime}
                      views={["hours", "minutes"]}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          "&:hover": {
                            "& > fieldset": {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        },
                      }}
                    />
                  </Stack>
                </LocalizationProvider>

                <Button
                  variant="contained"
                  onClick={handleScheduleBook}
                  disabled={
                    !selectedDate ||
                    !selectedTime ||
                    selectedServices.length === 0
                  }
                  startIcon={<Calendar className="h-4 w-4" />}
                  sx={{
                    mt: 2,
                    bgcolor: theme.palette.primary.main,
                    "&:hover": {
                      bgcolor: theme.palette.primary.dark,
                    },
                    "&.Mui-disabled": {
                      bgcolor: theme.palette.action.disabledBackground,
                    },
                  }}
                >
                  Schedule Booking
                </Button>
              </Stack>
            </>
          ) : (
            <Box>
              <Typography variant="h5" sx={{ mb: 4, fontWeight: 600 }}>
                Order Summary
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                    Selected Services:
                  </Typography>
                  {selectedServices.map((service) => (
                    <Box
                      key={service.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        bgcolor: theme.palette.background.light,
                        p: 2,
                        borderRadius: 2,
                        mb: 1,
                      }}
                    >
                      <Typography>{service.sub_service_name}</Typography>
                      <Typography fontWeight={500}>
                        ₹{parseFloat(service.price).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                    Appointment Details:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Calendar size={20} />
                      <Typography>
                        {selectedDate?.toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Clock size={20} />
                      <Typography>
                        {selectedTime?.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider />

                <Typography
                  variant="h5"
                  sx={{ fontWeight: 600, color: theme.palette.primary.main }}
                >
                  Total Amount: ₹{calculateTotal().toLocaleString()}
                </Typography>

                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Check className="h-4 w-4" />}
                  onClick={createOrder}
                  sx={{
                    mt: 2,
                    bgcolor: theme.palette.success.main,
                    "&:hover": {
                      bgcolor: theme.palette.success.dark,
                    },
                  }}
                >
                  Confirm Booking
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      </Popover>

      <Spashscreen
        open={showSuccessSplash}
        onClose={() => {
          setShowSuccessSplash(false);
        }}
      />
    </motion.div>
  );
};

const defaultSubServiceImages = {
  // Appliance Repair
  'AC Repair & Service': '/service_images/subservices/ac_repair.png',
  'Refrigerator Repair': '/service_images/subservices/refrigerator_repair.png',
  'Washing Machine Repair': '/service_images/subservices/washing_machine.png',

  // Home Cleaning
  'Bathroom Sanitization': '/service_images/subservices/bathroom_sanitization.png',
  'Deep Home Cleaning': '/service_images/subservices/deep_home_cleaning.png',
  'Kitchen Deep Cleaning': '/service_images/subservices/kitchen_deep_cleaning.png',

  // CCTV Install
  'CCTV Camera Installation': '/service_images/subservices/cctv_camera_install.png',
  'DVR & NVR Configuration': '/service_images/subservices/dvr_nvr_config.png',
  'Security Camera Repair': '/service_images/subservices/security_camera_repair.png',

  // Carpenter
  'Door & Window Repair': '/service_images/subservices/door_window_repair.png',
  'Furniture Assembly': '/service_images/subservices/furniture_assembly.png',
  'Modular Cabinet Making': '/service_images/subservices/modular_cabinet.png',

  // Electricians
  'Fan Repair & Install': '/service_images/subservices/fan_repair.png',
  'House Wiring & Fitting': '/service_images/subservices/house_wiring.png',
  'Switchboard Installation': '/service_images/subservices/switchboard_install.png',

  // WiFi Install
  'Fiber Connection Setup': '/service_images/subservices/fiber_connection.png',
  'Network Troubleshooting': '/service_images/subservices/network_troubleshooting.png',
  'Router Setup & Config': '/service_images/subservices/router_setup.png',

  // Painter
  'Full House Interior Paint': '/service_images/subservices/full_house_paint.png',
  'Texture & Accent Wall': '/service_images/subservices/texture_accent_wall.png',
  'Wall Waterproofing': '/service_images/subservices/wall_waterproofing.png',

  // Packers and Movers
  'Intercity Moving': '/service_images/subservices/intercity_moving.png',
  'Local House Shifting': '/service_images/subservices/local_house_shifting.png',
  'Office Furniture Relocation': '/service_images/subservices/office_relocation.png',

  // Plumber
  'Pipe Unclogging': '/service_images/subservices/pipe_unclogging.png',
  'Tap Repair & Leakage Fix': '/service_images/subservices/tap_repair.png',
  'Water Tank Cleaning': '/service_images/subservices/water_tank_cleaning.png'
};

const subServiceDescriptions = {
  // Appliance Repair
  'AC Repair & Service': 'Complete AC servicing, gas refilling, filter cleaning & cooling repair.',
  'Refrigerator Repair': 'Compressor check, thermostat repair, gas leak fix & cooling inspection.',
  'Washing Machine Repair': 'Drum repair, motor service, water inlet fix & drainage troubleshooting.',

  // Home Cleaning
  'Bathroom Sanitization': 'Deep stain removal, tile scrubbing, mirror polishing & anti-bacterial spray.',
  'Deep Home Cleaning': 'Full home vacuuming, floor scrubbing, furniture wiping & dust removal.',
  'Kitchen Deep Cleaning': 'Degreasing chimney, stove scrubbing, cabinet wiping & sink sanitization.',

  // CCTV Install
  'CCTV Camera Installation': 'HD camera mounting, wiring, DVR connection & mobile view configuration.',
  'DVR & NVR Configuration': 'Surveillance storage setup, network config & multi-camera channel sync.',
  'Security Camera Repair': 'Lens replacement, cable re-wiring, power supply repair & signal fix.',

  // Carpenter
  'Door & Window Repair': 'Hinge adjustment, latch fixing, wood trimming & frame alignment.',
  'Furniture Assembly': 'Flat-pack furniture building, bed setup, table assembly & hardware fitting.',
  'Modular Cabinet Making': 'Custom cabinet fitting, drawer slides install & kitchen storage crafting.',

  // Electricians
  'Fan Repair & Install': 'Ceiling fan mounting, regulator fitting, winding repair & noise fix.',
  'House Wiring & Fitting': 'Complete electrical circuit installation, breaker checks & concealed wiring.',
  'Switchboard Installation': 'Modular switchboard mounting, socket replacement & safety fuse check.',

  // WiFi Install
  'Fiber Connection Setup': 'High-speed optical fiber splicing, modem setup & signal line testing.',
  'Network Troubleshooting': 'WiFi dead zone fix, speed optimization, IP conflict & router diagnosis.',
  'Router Setup & Config': 'Dual-band router configuration, SSID naming & WPA3 security setup.',

  // Painter
  'Full House Interior Paint': 'Wall sanding, primer application & double-coat premium emulsion painting.',
  'Texture & Accent Wall': 'Custom geometric patterns, metallic glaze & decorative wall art finishes.',
  'Wall Waterproofing': 'Seepage repair, anti-fungal treatment & moisture barrier coating.',

  // Packers and Movers
  'Intercity Moving': 'Multi-layer bubble wrapping, safe truck loading & long-distance transport.',
  'Local House Shifting': 'Home furniture disassembly, careful packing, transport & re-assembly.',
  'Office Furniture Relocation': 'Workstation dismantling, computer packing, safe transit & office setup.',

  // Plumber
  'Pipe Unclogging': 'High-pressure jet clearing, sink unblocking & drain pipe maintenance.',
  'Tap Repair & Leakage Fix': 'Faucet washer replacement, leak sealing, mixer fitting & valve repair.',
  'Water Tank Cleaning': 'Sludge removal, high-pressure washing, UV disinfection & tank inspection.'
};

export const SubServiceCard = ({ subService, isSelected, onClick }) => {
  const theme = useTheme();

  const imgUrl =
    subService.image &&
    !subService.image.includes("/api/placeholder/")
      ? subService.image
      : defaultSubServiceImages[subService.name] ||
        "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=300&q=80";

  const description =
    subService.description ||
    subServiceDescriptions[subService.name] ||
    "Professional service by certified experts with 100% quality guarantee.";

  return (
    <Card
      onClick={onClick}
      elevation={isSelected ? 3 : 0}
      sx={{
        mb: 1.5,
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        borderRadius: 3,
        bgcolor: isSelected
          ? `${theme.palette.primary.light}18`
          : "background.paper",
        border: `2px solid ${
          isSelected ? theme.palette.primary.main : theme.palette.divider
        }`,
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.07)",
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          p: 1.5,
        }}
      >
        {/* Left Small Square Image */}
        <Box
          sx={{
            width: 90,
            height: 90,
            borderRadius: "12px",
            overflow: "hidden",
            flexShrink: 0,
            mr: 2,
            bgcolor: "grey.100",
            position: "relative",
          }}
        >
          <img
            src={imgUrl}
            alt={subService.name}
            onError={(e) => {
              e.target.src =
                defaultSubServiceImages[subService.name] ||
                "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=300&q=80";
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Box>

        {/* Right Info Section */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: "0.98rem",
              lineHeight: 1.25,
              mb: 0.25,
              color: isSelected ? "primary.main" : "text.primary",
            }}
          >
            {subService.name}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 0.5,
              flexWrap: "wrap",
            }}
          >
            <Chip
              label="★ 4.8"
              size="small"
              sx={{
                height: 20,
                fontSize: "0.725rem",
                fontWeight: 700,
                bgcolor: "#2e7d32",
                color: "#ffffff",
                borderRadius: "4px",
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              • 20-30 mins
            </Typography>
          </Box>

          {/* Detailed Description */}
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontSize: "0.8rem",
              lineHeight: 1.3,
              mb: 0.75,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "primary.main",
                fontSize: "0.85rem",
              }}
            >
              {subService.providers_count !== undefined
                ? `${subService.providers_count} Providers Available`
                : "Available Now"}
            </Typography>
            {isSelected && (
              <Chip
                label="Selected"
                color="primary"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Card>
  );
};


