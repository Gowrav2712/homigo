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
        variant="h1"
        sx={{
          color: 'background.paper',
          mb: 1.5,
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
          textAlign: 'center'
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
          px: 1
        }}
      >
        A Platform for On-Demand Local Home Services
      </Typography>
      <Button variant="outlined" onClick={showSignUp}>
        Join Us
      </Button>
    </Box>
  );
}

export default WelcomeContent;
