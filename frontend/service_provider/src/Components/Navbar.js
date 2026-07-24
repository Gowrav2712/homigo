import React, { useState } from "react";
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  IconButton,
  Button,
  Divider,
  ListItemIcon,
} from "@mui/material";
import {
  Home as HomeIcon,
  AccountCircle,
  EventNote,
  Logout,
  LocationOn,
  Settings as SettingsIcon,
  ContactSupport as ContactSupportIcon,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import ModifyServicesModal from "./ModifyServicesModal";
import NotificationMenu from "./NotificationMenu";
import ContactUsModal from "./ContactUsModal";

const Navbar = ({ userName, location }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [modifyServicesModalOpen, setModifyServicesModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const open = Boolean(anchorEl);

  const getFormattedLocation = () => {
    if (!location?.address) return "Location not available";
    const addressParts = location.address.split(",");
    return [addressParts[2], addressParts[5]].join(", ").trim();
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("providerId");
    localStorage.removeItem("providerName");
    localStorage.removeItem("providerEmail");
    localStorage.removeItem("mainServiceId");
    navigate("/");
  };

  const handleModifyServicesClick = () => {
    handleClose(); // Close the menu
    setModifyServicesModalOpen(true);
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          padding: { xs: '0 4px', sm: '0 10px' },
          height: "70px",
          zIndex: 1100,
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
            width: "100%",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Link
              to="/"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Typography
                variant="title"
                sx={{
                  color: "secondary.main",
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)",
                  cursor: "pointer",
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Homigo
              </Typography>
            </Link>
            <Button
              startIcon={<HomeIcon />}
              onClick={() => navigate("/")}
              sx={{
                color: "secondary.main",
                textTransform: "none",
                fontWeight: 700,
                fontSize: { xs: '0.85rem', sm: '1rem' },
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 1, sm: 2 },
                "&:hover": { bgcolor: "rgba(100, 100, 200, 0.08)" },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Home</Box>
            </Button>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "background.paper",
                borderRadius: "1.5rem",
                bgcolor: "secondary.main",
                padding: { xs: '0.4rem 0.6rem', sm: '0.5rem' },
                maxWidth: { xs: '120px', sm: '220px', md: 'none' },
                overflow: 'hidden',
              }}
            >
              <LocationOn sx={{ fontSize: "1.2rem", flexShrink: 0 }} />
              <Typography sx={{
                fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {getFormattedLocation()}
              </Typography>
            </Box>
            
            {/* Notification Menu - Placed here next to the avatar */}
            <NotificationMenu />
            
            <Tooltip title="Account settings">
              <IconButton
                onClick={handleClick}
                size="small"
                aria-controls={open ? "account-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "secondary.main",
                    color: "background.paper",
                  }}
                >
                  {userName.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                mt: 1.5,
                bgcolor: "background.paper",
                "&::before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: "background.paper",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                },
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem
            onClick={() => {
              handleClose();
              navigate("/");
            }}
          >
            <ListItemIcon>
              <HomeIcon fontSize="small" sx={{ color: "text.muted" }} />
            </ListItemIcon>
            Home
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleClose();
              navigate("/profile");
            }}
          >
            <ListItemIcon>
              <AccountCircle fontSize="small" sx={{ color: "text.muted" }} />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleClose();
              navigate("/orders");
            }}
          >
            <ListItemIcon>
              <EventNote fontSize="small" sx={{ color: "text.muted" }} />
            </ListItemIcon>
            Order History
          </MenuItem>
          <MenuItem onClick={handleModifyServicesClick}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" sx={{ color: "text.muted" }} />
            </ListItemIcon>
            Modify Services
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              handleClose();
              setIsContactModalOpen(true);
            }}
          >
            <ListItemIcon>
              <ContactSupportIcon fontSize="small" sx={{ color: "text.muted" }} />
            </ListItemIcon>
            Contact Us
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" sx={{ color: "text.muted" }} />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Box>
      <ModifyServicesModal
        open={modifyServicesModalOpen}
        onClose={() => setModifyServicesModalOpen(false)}
      />
      <ContactUsModal
        open={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </>
  );
};

export default Navbar;