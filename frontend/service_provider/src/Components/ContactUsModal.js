import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const ContactUsModal = ({ open, onClose }) => {
  const whatsappNumber = "919980469297";
  const displayPhone = "9980469297";
  const email = "homigo24@gmail.com";
  const address = "Karnataka, Mandya - 571401";

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hello Homigo Team! I am a Service Provider with a query.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handleEmailClick = () => {
    window.open(`mailto:${email}?subject=Homigo%20Provider%20Support%20Inquiry`, '_blank');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Contact Us
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          We're here to support our Service Providers! Reach out directly via WhatsApp, Email, or visit our office.
        </Typography>

        <Stack spacing={2}>
          {/* WhatsApp Contact Card */}
          <Paper
            elevation={0}
            onClick={handleWhatsAppClick}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: '#e8f5e9',
              border: '1.5px solid #a5d6a7',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 18px rgba(46, 125, 50, 0.18)',
              },
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bgcolor: '#2e7d32',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WhatsAppIcon sx={{ fontSize: 26 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1b5e20' }}>
                    WhatsApp Support
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                    +91 {displayPhone}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#2e7d32',
                  '&:hover': { bgcolor: '#1b5e20' },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Chat
              </Button>
            </Box>
          </Paper>

          {/* Email / Gmail Contact Card */}
          <Paper
            elevation={0}
            onClick={handleEmailClick}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: '#e3f2fd',
              border: '1.5px solid #90caf9',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 18px rgba(25, 118, 210, 0.18)',
              },
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bgcolor: '#1976d2',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <EmailIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0d47a1' }}>
                    Email Support
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                    {email}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#1976d2',
                  '&:hover': { bgcolor: '#0d47a1' },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Email
              </Button>
            </Box>
          </Paper>

          {/* Address Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'grey.50',
              border: '1.5px solid',
              borderColor: 'grey.300',
            }}
          >
            <Box display="flex" alignItems="flex-start" gap={2}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LocationOnIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Our Office Address
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.25 }}>
                  {address}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ContactUsModal;
