import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import { Groups as GroupsIcon, Category as CategoryIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWelcomeViewContext } from "../Contexts/WelcomeViewContextProvider";
import { API_BASE_URL } from '../config';

const defaultServiceImages = {
  'Appliance Repair': '/service_images/appliance_repair.png',
  'Home Cleaning': '/service_images/home_cleaning.png',
  'CCTV Install': '/service_images/cctv_install.png',
  'Carpenter': '/service_images/carpenter.png',
  'Electricians': '/service_images/electricians.png',
  'WiFi Install': '/service_images/wifi_install.png',
  'Painter': '/service_images/painter.png',
  'Packers and Movers': '/service_images/packers_movers.png',
  'Plumber': '/service_images/plumber.png'
};

const getServiceImage = (serviceName, imageBase64) => {
  if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.trim() !== '' && imageBase64 !== 'null') {
    return imageBase64;
  }
  return defaultServiceImages[serviceName] || 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80';
};

const MotionCard = motion(Card);

const MainServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const {setSelectedSubService} =useWelcomeViewContext();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/services/`);
        const data = await response.json();
        if (data.status && data.data.results) {
          setServices(data.data.results.map(item => item.data));
        } else {
          throw new Error('Invalid data format');
        }
      } catch (err) {
        setError('Failed to load services. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleCardClick = (serviceId) => {
    setSelectedSubService(null);
    navigate(`/service/${serviceId}`);
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ color: theme.palette.primary.main }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography 
        variant="h1" 
        component="h1" 
        gutterBottom
        sx={{
          mb: 8,
          fontSize: { xs: '2.5rem', md: '3.5rem' },
          fontWeight: 700,
          textAlign: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
        }}
      >
        Our Services
      </Typography>

      <Grid container spacing={4}>
        {services.map((service, index) => (
          <Grid item xs={12} sm={6} md={4} key={service.id}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: [0.4, 0, 0.2, 1]
              }}
              onClick={() => handleCardClick(service.id)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                  '& .MuiCardMedia-root': {
                    transform: 'scale(1.05)',
                  },
                },
              }}
            >
              <CardMedia
                component="img"
                height="220"
                image={getServiceImage(service.name, service.image_base64)}
                alt={service.name}
                onError={(e) => {
                  e.target.src = defaultServiceImages[service.name] || 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80';
                }}
                sx={{
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  objectFit: 'cover'
                }}
              />


              <CardContent 
                sx={{ 
                  flexGrow: 1, 
                  p: 3,
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), #ffffff)'
                }}
              >
                <Typography
                  gutterBottom
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    mb: 2.5,
                    color: theme.palette.text.primary,
                    fontSize: '1.5rem',
                    lineHeight: 1.2,
                  }}
                >
                  {service.name}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <Chip
                    icon={<CategoryIcon sx={{ fontSize: '1.1rem' }} />}
                    label={`${service.sub_services_count} Sub-services`}
                    color="primary"
                    variant="outlined"
                    size="medium"
                    sx={{
                      borderRadius: '8px',
                      '& .MuiChip-label': {
                        px: 1,
                        fontWeight: 500,
                      },
                      borderColor: 'rgba(0,0,0,0.12)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                        borderColor: 'transparent',
                      }
                    }}
                  />
                  <Chip
                    icon={<GroupsIcon sx={{ fontSize: '1.1rem' }} />}
                    label={`${service.providers_count} Providers`}
                    color="secondary"
                    variant="outlined"
                    size="medium"
                    sx={{
                      borderRadius: '8px',
                      '& .MuiChip-label': {
                        px: 1,
                        fontWeight: 500,
                      },
                      borderColor: 'rgba(0,0,0,0.12)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.secondary.main,
                        color: 'white',
                        borderColor: 'transparent',
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default MainServices;