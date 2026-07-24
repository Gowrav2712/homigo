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
        width: { xs: '95%', sm: '90%', md: '80%' },
        minHeight: { xs: '90vh', md: '85vh' },
        margin: 'auto',
        marginTop: { xs: '1rem', sm: '2rem' },
        marginBottom: { xs: '1rem', sm: '2rem' },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '20px',
        boxSizing: 'border-box',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
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