import React from 'react';
import { useWelcomeViewContext } from "../Contexts/WelcomeViewContextProvider";
import { Typography, Button, Box } from '@mui/material';

const WelcomeContent = () => {
  const { showSignUp } = useWelcomeViewContext();

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        bgcolor: 'secondary.main',
        transition: 'width 0.5s ease-in-out',
        padding: '2rem',
        '.welcome[data-view="signup"] &, .welcome[data-view="login"] &, .welcome[data-view="otp"] &': {
          width: { xs: '0%', md: '50%' },
          display: { xs: 'none', md: 'flex' }
        }
      }}
    >
      <Typography
        variant="title"
        sx={{
          color: 'background.paper',
          mb: 1.5,
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.4)',
        }}
      >
        Homigo
      </Typography>
      <Typography
        variant="h5"
        sx={{
          color: 'background.paper',
          mb: 3,
          fontSize: { xs: '1.05rem', sm: '1.25rem', md: '1.5rem' },
          textAlign: 'center',
          px: 1,
          textShadow: '1px 1px 3px rgba(0, 0, 0, 0.5)',
        }}
      >
        A Platform for On-Demand Local Home Services
      </Typography>
      <Button variant="outlined" onClick={showSignUp} sx={{ mb: 2.5 }}>
        Join Us
      </Button>
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255, 255, 255, 0.85)',
          fontWeight: 600,
          letterSpacing: '0.5px',
          textShadow: '1px 1px 3px rgba(0, 0, 0, 0.5)',
        }}
      >
        Service Providers
      </Typography>
    </Box>
  );
}

export default WelcomeContent;
