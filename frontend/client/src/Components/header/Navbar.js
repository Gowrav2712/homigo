import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import { useNavigate } from "react-router-dom";
import MapIcon from "@mui/icons-material/Map";
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Fade,
  Chip,
  Typography,
  Autocomplete,
  InputAdornment,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import LocationPicker from "./LocationPicker";

import { styled, alpha } from "@mui/material/styles";
import ClearIcon from "@mui/icons-material/Clear";
import CircularProgress from "@mui/material/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import LoginIcon from "@mui/icons-material/Login";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ReceiptIcon from "@mui/icons-material/Receipt";
import HandymanIcon from "@mui/icons-material/Handyman";
import CloseIcon from "@mui/icons-material/Close";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import MenuIcon from "@mui/icons-material/Menu";
import AuthModal from "../authentication/AuthModal.js";
import ClientNotificationMenu from "./ClientNotificationMenu";
import ContactUsModal from "../ContactUsModal";

import { useWelcomeViewContext } from "../../Contexts/WelcomeViewContextProvider";

const StyledAppBar = styled(AppBar)(({ theme, isscrolled }) => ({
  backgroundColor: theme.palette.common.white,
  transition: "all 0.3s ease",
  boxShadow: isscrolled === "true" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
  borderBottom: "1px solid",
  borderColor: alpha(theme.palette.grey[300], 0.8),
}));

const LogoContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
});

const LogoText = styled(Typography)(({ theme }) => ({
  fontFamily: "Righteous, cursive",
  fontSize: "1.8rem",
  fontWeight: "bold",
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  "& .icon": {
    color: theme.palette.primary.main,
    fontSize: "1.6rem",
    transform: "rotate(-15deg)",
  },
  "& .highlight": {
    color: theme.palette.primary.main,
  },
}));

const LocationChip = styled(Chip)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.grey[100], 0.8),
  "&:hover": {
    backgroundColor: alpha(theme.palette.grey[200], 0.8),
  },
  height: "40px",
  padding: "0 8px",
  maxWidth: "160px",
  "& .MuiChip-label": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  "& .MuiChip-icon": {
    color: theme.palette.grey[600],
  },
}));

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
  width: "100%",
  "& .MuiOutlinedInput-root": {
    backgroundColor: alpha(theme.palette.grey[100], 0.8),
    borderRadius: "8px",
    padding: "2px 4px",
    transition: theme.transitions.create(["background-color", "box-shadow"]),
    "& fieldset": {
      borderColor: "transparent",
    },
    "&:hover": {
      backgroundColor: alpha(theme.palette.grey[100], 1),
    },
    "&.Mui-focused": {
      backgroundColor: theme.palette.common.white,
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
      "& fieldset": {
        borderColor: theme.palette.primary.main,
      },
    },
  },
  "& .MuiAutocomplete-input": {
    padding: "7.5px 4px 7.5px 0 !important",
    height: "25px",
    fontSize: "0.875rem",
    color: theme.palette.text.primary,
  },
}));

const SearchLoadingIndicator = styled(CircularProgress)(({ theme }) => ({
  color: theme.palette.grey[500],
  size: 20,
}));

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [locationAnchorEl, setLocationAnchorEl] = useState(null);
  const [userName, setUserName] = useState("");
  const [allSubServices, setAllSubServices] = useState([]);
  const [searchValue, setSearchValue] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [filteredServices, setFilteredServices] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const {
    isAuthModalOpen,
    handleCloseAuthModal,
    handleOpenAuthModal,
    isLoggedIn,
    handleLogout,
    setSelectedSubService,
    location,
    setLocation,
  } = useWelcomeViewContext();

  // Fetch subservices once on mount for instant native Autocomplete searching
  useEffect(() => {
    const fetchAllSubServices = async () => {
      try {
        setIsSearching(true);
        const response = await fetch(`${API_BASE_URL}/sub_services/listAll/`);
        const data = await response.json();
        if (data.status && data.data?.results) {
          setAllSubServices(data.data.results);
        }
      } catch (error) {
        console.error("Error fetching subservices:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchAllSubServices();
  }, []);

  const handleSearchInput = (event, newInputValue, reason) => {
    setInputValue(newInputValue);
    if (reason === "input" || reason === "clear") {
      setSearchValue(null);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.pageYOffset > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    setUserName(storedUserName || "");
    const userLocation = localStorage.getItem("userLocation");
    if (userLocation) {
      try {
        const parsedLocation = JSON.parse(userLocation);
        setLocation(parsedLocation);
      } catch (error) {
        console.error("Error parsing location:", error);
      }
    } else {
      setLocation(null);
    }
  }, [isLoggedIn, setLocation]);

  const formatAddress = (address) => {
    if (!address) return "";
    const parts = address.split(",");
    return parts.slice(0, 2).join(",");
  };

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLocationClick = (event) => {
    setLocationAnchorEl(event.currentTarget);
  };

  const handleLocationMenuClose = () => {
    setLocationAnchorEl(null);
  };

  const handleOpenLocationPicker = () => {
    setIsLocationPickerOpen(true);
  };

  const handleCloseLocationPicker = () => {
    setIsLocationPickerOpen(false);
  };

  const handleConfirmLocation = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      if (!response.ok) throw new Error("Failed to fetch location details");
      const data = await response.json();
      const locationData = {
        latitude: lat,
        longitude: lng,
        address: data.display_name || `Latitude: ${lat}, Longitude: ${lng}`,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("userLocation", JSON.stringify(locationData));
      setLocation(locationData);
      handleCloseLocationPicker();
    } catch (error) {
      console.error("Error confirming location:", error);
      const fallbackLocationData = {
        latitude: lat,
        longitude: lng,
        address: `Latitude: ${lat}, Longitude: ${lng}`,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("userLocation", JSON.stringify(fallbackLocationData));
      setLocation(fallbackLocationData);
      handleCloseLocationPicker();
      alert("Could not fetch exact address. Using coordinates instead.");
    }
  };

  const handleSearchChange = (event, newValue) => {
    setSearchValue(newValue);
    if (newValue) {
      setSelectedSubService(newValue);
      setMobileSearchOpen(false);
      navigate(`/service/${newValue.main_service}`);
    }
  };

  const searchComponent = (
    <StyledAutocomplete
      value={searchValue}
      onChange={handleSearchChange}
      inputValue={inputValue}
      onInputChange={handleSearchInput}
      options={allSubServices}
      isOptionEqualToValue={(option, value) => option?.id === value?.id}
      getOptionLabel={(option) => (typeof option === "string" ? option : option?.name || "")}
      loading={isSearching}
      loadingText="Loading services..."
      noOptionsText="No services found"
      ListboxProps={{
        sx: {
          maxHeight: "350px",
          "& .MuiAutocomplete-listbox": { padding: 0 },
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search for services..."
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "grey.500" }} />
              </InputAdornment>
            ),
            endAdornment: (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {isSearching && (
                  <SearchLoadingIndicator size={20} sx={{ mr: 1 }} />
                )}
                {inputValue && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setInputValue("");
                      setSearchValue(null);
                    }}
                    sx={{
                      p: 0.5,
                      position: "absolute",
                      right: "8px",
                      "&:hover": { backgroundColor: "transparent" },
                    }}
                  >
                    <ClearIcon sx={{ fontSize: 18, color: "grey.500" }} />
                  </IconButton>
                )}
              </Box>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              p: "2px 4px",
              paddingRight: "36px",
            },
          }}
        />
      )}
      renderOption={(props, option) => (
        <MenuItem
          {...props}
          key={option.id}
          sx={{
            py: 1.5,
            px: 2,
            minHeight: "auto",
            width: "100%",
            whiteSpace: "normal",
            "&:hover": { backgroundColor: alpha("#000", 0.04) },
          }}
        >
          <Box sx={{ width: "100%", minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, wordWrap: "break-word" }}
            >
              {option.name}
            </Typography>
          </Box>
        </MenuItem>
      )}
      PaperProps={{
        sx: {
          mt: 1,
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          width: { xs: "90vw", sm: "600px" },
          maxWidth: "80vw",
          "& .MuiAutocomplete-listbox": {
            padding: 0,
            maxHeight: "400px",
            width: "100%",
          },
        },
      }}
      PopperProps={{
        placement: "bottom-start",
        sx: { width: { xs: "90vw !important", sm: "600px !important" }, maxWidth: "80vw !important" },
      }}
    />
  );

  // Mobile Drawer content
  const drawerContent = (
    <Box sx={{ width: 280, pt: 2, pb: 4 }} role="presentation">
      {/* Logo in drawer */}
      <Box sx={{ px: 2, pb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography
          sx={{
            fontFamily: "Righteous, cursive",
            fontSize: "1.6rem",
            fontWeight: "bold",
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          <HandymanIcon sx={{ verticalAlign: "middle", mr: 0.5, color: theme.palette.primary.main, WebkitTextFillColor: theme.palette.primary.main }} />
          Homigo
        </Typography>
        <IconButton onClick={() => setMobileDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Mobile Search */}
      <Box sx={{ px: 2, mb: 2 }}>
        {searchComponent}
      </Box>

      {/* Location chip */}
      {isLoggedIn && (
        <Box sx={{ px: 2, mb: 2 }}>
          <Chip
            icon={<LocationOnIcon />}
            label={location ? formatAddress(location.address) : "Set Location"}
            onClick={() => {
              handleOpenLocationPicker();
              setMobileDrawerOpen(false);
            }}
            clickable
            sx={{ width: "100%", justifyContent: "flex-start", height: 40 }}
          />
        </Box>
      )}

      <Divider />

      {isLoggedIn ? (
        <List>
          <ListItem
            button
            onClick={() => { navigate("/profile"); setMobileDrawerOpen(false); }}
          >
            <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItem>
          <ListItem
            button
            onClick={() => { navigate("/orders"); setMobileDrawerOpen(false); }}
          >
            <ListItemIcon><ReceiptIcon color="primary" /></ListItemIcon>
            <ListItemText primary="My Orders" />
          </ListItem>
          <ListItem
            button
            onClick={() => { setIsContactModalOpen(true); setMobileDrawerOpen(false); }}
          >
            <ListItemIcon><SupportAgentIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Contact Us" />
          </ListItem>
          <Divider />
          <ListItem
            button
            onClick={() => { handleLogout(); setMobileDrawerOpen(false); }}
          >
            <ListItemIcon><LoginIcon color="error" /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ color: "error" }} />
          </ListItem>
        </List>
      ) : (
        <List>
          <ListItem
            button
            onClick={() => { setIsContactModalOpen(true); setMobileDrawerOpen(false); }}
          >
            <ListItemIcon><SupportAgentIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Contact Us" />
          </ListItem>
          <ListItem
            button
            onClick={() => { handleOpenAuthModal(); setMobileDrawerOpen(false); }}
          >
            <ListItemIcon><LoginIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Login / Sign Up" />
          </ListItem>
        </List>
      )}
    </Box>
  );

  return (
    <>
      <StyledAppBar
        position="sticky"
        isscrolled={isScrolled.toString()}
        elevation={0}
      >
        <Toolbar sx={{ py: { xs: 1, sm: 1.5 }, gap: { xs: 1, sm: 2 }, minHeight: { xs: 60, sm: 64 } }}>
          {/* Logo */}
          <LogoContainer onClick={() => { navigate("/"); setSearchValue(null); }}>
            <LogoText variant="h1">
              <HandymanIcon className="icon" />
              {!isMobile && "Homigo"}
              {isMobile && "H"}
            </LogoText>
          </LogoContainer>

          {/* Location chip — hide on xs */}
          {isLoggedIn && !isMobile && (
            <Tooltip title="Click to view or change location" arrow placement="bottom">
              <LocationChip
                icon={<LocationOnIcon />}
                label={location ? formatAddress(location.address) : "Set Location"}
                onClick={handleLocationClick}
                clickable
              />
            </Tooltip>
          )}

          {/* Desktop search — hidden on mobile */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
            {searchComponent}
          </Box>

          {/* Spacer on mobile/tablet */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }} />

          {/* Right side actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
            {/* Mobile search icon */}
            {isMobile && (
              <IconButton
                color="primary"
                onClick={() => setMobileSearchOpen(true)}
                sx={{ backgroundColor: alpha("#000", 0.04) }}
              >
                <SearchIcon />
              </IconButton>
            )}

            {isLoggedIn ? (
              <>
                <IconButton
                  color="primary"
                  sx={{ backgroundColor: alpha("#000", 0.04) }}
                >
                  <ClientNotificationMenu />
                </IconButton>

                {/* Desktop profile menu */}
                <Box sx={{ display: { xs: "none", sm: "flex" } }}>
                  <IconButton
                    onClick={handleProfileClick}
                    sx={{
                      p: 0.5,
                      backgroundColor: alpha("#000", 0.04),
                      "&:hover": { backgroundColor: alpha("#000", 0.08) },
                    }}
                  >
                    <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                      {userName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    onClick={handleMenuClose}
                    PaperProps={{
                      elevation: 2,
                      sx: {
                        mt: 1.5,
                        minWidth: 180,
                        borderRadius: "8px",
                        backgroundColor: "common.white",
                      },
                    }}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  >
                    <MenuItem sx={{ py: 1.5 }} onClick={() => navigate("/profile")}>
                      <PersonIcon sx={{ mr: 2, color: "grey.600" }} /> Profile
                    </MenuItem>
                    <MenuItem sx={{ py: 1.5 }} onClick={() => navigate("/orders")}>
                      <ReceiptIcon sx={{ mr: 2, color: "grey.600" }} /> My Orders
                    </MenuItem>
                    <MenuItem
                      onClick={() => { handleMenuClose(); setIsContactModalOpen(true); }}
                      sx={{ py: 1.5 }}
                    >
                      <SupportAgentIcon sx={{ mr: 2, color: "primary.main" }} /> Contact Us
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: "error.main" }}>
                      <LoginIcon sx={{ mr: 2 }} /> Logout
                    </MenuItem>
                  </Menu>
                </Box>

                {/* Mobile hamburger (logged in) */}
                <IconButton
                  sx={{ display: { xs: "flex", sm: "none" }, backgroundColor: alpha("#000", 0.04) }}
                  onClick={() => setMobileDrawerOpen(true)}
                >
                  <MenuIcon />
                </IconButton>
              </>
            ) : (
              <>
                {/* Desktop buttons */}
                <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1.5, alignItems: "center" }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<SupportAgentIcon />}
                    onClick={() => setIsContactModalOpen(true)}
                    sx={{ borderRadius: "8px", textTransform: "none", px: 2, py: 0.8 }}
                  >
                    Contact Us
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LoginIcon />}
                    onClick={handleOpenAuthModal}
                    sx={{ borderRadius: "8px", textTransform: "none", px: 3, py: 1 }}
                  >
                    Login
                  </Button>
                </Box>

                {/* Mobile hamburger (logged out) */}
                <IconButton
                  sx={{ display: { xs: "flex", sm: "none" }, backgroundColor: alpha("#000", 0.04) }}
                  onClick={() => setMobileDrawerOpen(true)}
                >
                  <MenuIcon />
                </IconButton>
              </>
            )}
          </Box>
        </Toolbar>
      </StyledAppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Search Dialog */}
      <Dialog
        open={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiDialog-container": {
            alignItems: "flex-start",
            pt: { xs: 1, sm: 3 },
          },
        }}
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2 },
            mt: { xs: 1, sm: 2 },
            borderRadius: 3,
            p: 2,
            width: "calc(100% - 16px)",
            maxHeight: "85vh",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 0.5, px: 0.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={700} variant="subtitle1">Search Services</Typography>
          <IconButton size="small" onClick={() => setMobileSearchOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, px: 0.5, pb: 1 }}>
          {searchComponent}
        </DialogContent>
      </Dialog>

      {/* Location dropdown */}
      <Menu
        anchorEl={locationAnchorEl}
        open={Boolean(locationAnchorEl)}
        onClose={handleLocationMenuClose}
        TransitionComponent={Fade}
        PaperProps={{
          elevation: 2,
          sx: { mt: 1.5, maxWidth: "90vw", width: "360px", padding: "16px", borderRadius: "8px" },
        }}
      >
        <Box sx={{ p: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "grey.700", mb: 1 }}>
            <LocationOnIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2">Current Location</Typography>
          </Box>
          <Typography variant="body1" sx={{ color: "grey.800", fontWeight: 500, mb: 2, wordBreak: "break-word" }}>
            {location?.address}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "grey.600",
              mb: 2,
              borderTop: 1,
              borderColor: "grey.200",
              pt: 2,
            }}
          >
            Last updated: {new Date(location?.timestamp).toLocaleString()}
          </Typography>
          <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <Button
              startIcon={<MapIcon />}
              onClick={() => { handleOpenLocationPicker(); handleLocationMenuClose(); }}
              sx={{
                mt: 1,
                textTransform: "none",
                borderRadius: 2,
                py: 1,
                px: 3,
                minWidth: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Set Location on Map
            </Button>
          </Box>
        </Box>
      </Menu>

      <Dialog
        open={isLocationPickerOpen}
        onClose={handleCloseLocationPicker}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: { xs: "90vh", sm: "80vh" },
            m: { xs: 1, sm: 2 },
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle>
          Pick Your Location
          <IconButton
            aria-label="close"
            onClick={handleCloseLocationPicker}
            sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: 0, height: "calc(100% - 64px)", flexGrow: 1, display: "flex" }}>
          {isLocationPickerOpen && (
            <LocationPicker
              initialPosition={location ? [location.latitude, location.longitude] : [12.2799972, 76.6520893]}
              onConfirm={handleConfirmLocation}
            />
          )}
        </DialogContent>
      </Dialog>

      <AuthModal open={isAuthModalOpen} onClose={handleCloseAuthModal} />
      <ContactUsModal open={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </>
  );
};

export default Navbar;
