import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { Box, Typography, Button, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWelcomeViewContext } from '../Contexts/WelcomeViewContextProvider';

const applianceRepair = "/service_images/appliance_repair.png";
const homeCleaning = "/service_images/home_cleaning.png";
const cctvInstall = "/service_images/cctv_install.png";
const carpenter = "/service_images/carpenter.png";
const electrician = "/service_images/electricians.png";
const wifiInstall = "/service_images/wifi_install.png";
const painting = "/service_images/painter.png";
const packersMovers = "/service_images/packers_movers.png";
const plumber = "/service_images/plumber.png";

const ServiceCard = ({ title, icon, description, rating, startingPrice, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      p: { xs: 2.5, sm: 4 },
      bgcolor: 'background.paper',
      borderRadius: 3,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
      height: '100%',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: (theme) => `0 8px 24px ${theme.palette.primary.light}25`
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '4px',
        background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      }
    }}
  >
    <Box
      sx={{
        width: '100%',
        height: { xs: '130px', sm: '160px' },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: { xs: 2, sm: 3 },
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <img
        src={icon}
        alt={title}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 1,
          left: 1,
          bgcolor: 'background.paper',
          borderRadius: 1,
          px: 1.5,
          py: 0.75,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}
      >
        <Star size={14} />
        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
          {rating}
        </Typography>
      </Box>
    </Box>

    <Typography
      variant="h6"
      sx={{ fontWeight: 600, color: 'text.primary', mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}
    >
      {title}
    </Typography>

    <Typography
      variant="body2"
      sx={{ color: 'text.secondary', mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
    >
      {description}
    </Typography>

    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
        From {startingPrice}
      </Typography>
    </Box>
  </Box>
);

const ServiceSlider = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const cardsPerView = isMobile ? 1 : isTablet ? 2 : 3;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dbServices, setDbServices] = useState([]);
  const navigate = useNavigate();
  const { setSelectedSubService } = useWelcomeViewContext();

  useEffect(() => {
    fetch(`${API_BASE_URL}/services/`)
      .then(res => res.json())
      .then(data => {
        if (data.status && data.data && data.data.results) {
          setDbServices(data.data.results.map(item => item.data));
        }
      })
      .catch(err => console.error("Error fetching services:", err));
  }, []);

  // Reset index when cardsPerView changes (responsive resize)
  useEffect(() => {
    setCurrentIndex(0);
  }, [cardsPerView]);

  const services = [
    { title: "Appliance Repair", description: "AC, Fridge & Washing Machine repair", rating: 4.8, startingPrice: "₹499", image: applianceRepair, category: "repair" },
    { title: "Home Cleaning", description: "Sanitization & deep home cleaning", rating: 4.9, startingPrice: "₹599", image: homeCleaning, category: "cleaning" },
    { title: "CCTV Install", description: "Security cameras & DVR setup", rating: 4.8, startingPrice: "₹699", image: cctvInstall, category: "security" },
    { title: "Carpenter", description: "Doors, furniture & modular cabinets", rating: 4.7, startingPrice: "₹399", image: carpenter, category: "carpenter" },
    { title: "Electricians", description: "Fan installation & house wiring", rating: 4.9, startingPrice: "₹299", image: electrician, category: "electrician" },
    { title: "WiFi Install", description: "Fiber setup & router config", rating: 4.8, startingPrice: "₹349", image: wifiInstall, category: "network" },
    { title: "Painter", description: "Interior painting & waterproofing", rating: 4.7, startingPrice: "₹899", image: painting, category: "paint" },
    { title: "Packers and Movers", description: "Intercity & local house shifting", rating: 4.8, startingPrice: "₹1499", image: packersMovers, category: "shifting" },
    { title: "Plumber", description: "Pipe unclogging & tap repair", rating: 4.9, startingPrice: "₹249", image: plumber, category: "plumber" }
  ];

  const maxIndex = Math.max(0, services.length - cardsPerView);

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const handleCardClick = (serviceTitle) => {
    setSelectedSubService(null);
    const matched = dbServices.find(
      s => s.name.toLowerCase().trim() === serviceTitle.toLowerCase().trim()
    );
    if (matched) {
      navigate(`/service/${matched.id}`);
    } else if (dbServices.length > 0) {
      navigate(`/service/${dbServices[0].id}`);
    }
  };

  // card width calculation
  const gap = 16; // px
  const cardWidthPercent = cardsPerView === 1 ? 100 : cardsPerView === 2 ? 50 : 33.333;

  return (
    <Box sx={{
      width: '100%',
      py: { xs: 5, sm: 8 },
      background: (theme) => `linear-gradient(to bottom, ${theme.palette.primary.light}15, ${theme.palette.primary.light}05, ${theme.palette.background.paper})`,
      overflowX: 'hidden',
    }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h4"
          sx={{ mb: 1, fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
        >
          Popular Services
        </Typography>

        <Typography variant="body1" sx={{
          textAlign: 'center',
          color: 'text.secondary',
          mb: { xs: 3, sm: 6 },
          maxWidth: '600px',
          mx: 'auto',
          fontSize: { xs: '0.9rem', sm: '1rem' },
        }}>
          Discover our most booked services with top-rated professionals ready to help
        </Typography>

        {/* Slider container */}
        <Box sx={{ position: 'relative' }}>
          {/* Prev button */}
          <Button
            onClick={prevSlide}
            aria-label="Previous"
            sx={{
              minWidth: 'auto',
              position: 'absolute',
              left: { xs: -8, sm: -20 },
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              p: { xs: 1, sm: 1.5 },
              borderRadius: '50%',
              boxShadow: 2,
              zIndex: 1,
              '&:hover': { bgcolor: 'background.paper', transform: 'translateY(-50%) scale(1.1)' }
            }}
          >
            <ChevronLeft size={isMobile ? 18 : 24} />
          </Button>

          {/* Track wrapper */}
          <Box sx={{ overflow: 'hidden', mx: { xs: 2, sm: 4 } }}>
            <Box
              sx={{
                display: 'flex',
                gap: `${gap}px`,
                transition: 'transform 0.5s ease-out',
                transform: `translateX(calc(-${currentIndex * cardWidthPercent}% - ${currentIndex * gap}px))`,
              }}
            >
              {services.map((service, index) => (
                <Box
                  key={index}
                  sx={{
                    minWidth: `calc(${cardWidthPercent}% - ${((cardsPerView - 1) * gap) / cardsPerView}px)`,
                    flex: '0 0 auto',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <ServiceCard
                    title={service.title}
                    icon={service.image}
                    description={service.description}
                    rating={service.rating}
                    startingPrice={service.startingPrice}
                    onClick={() => handleCardClick(service.title)}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Next button */}
          <Button
            onClick={nextSlide}
            aria-label="Next"
            sx={{
              minWidth: 'auto',
              position: 'absolute',
              right: { xs: -8, sm: -20 },
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'background.paper',
              p: { xs: 1, sm: 1.5 },
              borderRadius: '50%',
              boxShadow: 2,
              zIndex: 1,
              '&:hover': { bgcolor: 'background.paper', transform: 'translateY(-50%) scale(1.1)' }
            }}
          >
            <ChevronRight size={isMobile ? 18 : 24} />
          </Button>
        </Box>

        {/* Dots */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: { xs: 3, sm: 4 }, flexWrap: 'wrap' }}>
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <Button
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                minWidth: 'auto',
                width: index === currentIndex ? 32 : 8,
                height: 8,
                p: 0,
                borderRadius: 4,
                bgcolor: index === currentIndex ? 'primary.main' : 'primary.light',
                '&:hover': { bgcolor: 'primary.main' },
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ServiceSlider;
