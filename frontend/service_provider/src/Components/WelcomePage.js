import React from 'react';
import { useWelcomeViewContext } from "../Contexts/WelcomeViewContextProvider";
import WelcomeContent from "./WelcomeContent";
import SignUp from "./SignUp";
import Login from "./Login";
import VerifyOTP from "./VerifyOTP";
import { Box } from '@mui/material';

const WelcomePage = () => {
  const { view = "welcome" } = useWelcomeViewContext() || {};

  return (
    <Box 
      className="welcome" 
      data-view={view}
      sx={{
        position: 'relative',
        width: { xs: '90%', sm: '85%', md: '80%' },
        maxWidth: '1000px',
        minHeight: {
          xs: view === 'welcome' || !view ? '380px' : '85vh',
          sm: view === 'welcome' || !view ? '420px' : '85vh',
          md: '85vh'
        },
        margin: 'auto',
        marginTop: { xs: '2rem', sm: '3rem' },
        marginBottom: { xs: '2rem', sm: '3rem' },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '24px',
        boxSizing: 'border-box',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
      }}
    >
      <WelcomeContent />
      {view === "signup" && <SignUp />}
      {view === "login" && <Login />}
      {view === "otp" && <VerifyOTP />}
    </Box>
  );
}

export default WelcomePage;