import React from 'react';
import { useWelcomeViewContext } from '../../Contexts/WelcomeViewContextProvider';
import WelcomeContent from "../WelcomeContent";
import SignUp from "./SignUp";
import Login from "./Login";
import VerifyOTP from "./VerifyOTP";
import { Modal, Box,IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const AuthModal = ({ open, onClose }) => {
  const { view } = useWelcomeViewContext();
  
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box 
        className="welcome" 
        data-view={view}
        sx={{
          position: 'relative',
          width: { xs: '90%', sm: '85%', md: '80%' },
          maxWidth: '1100px',
          height: {
            xs: view === 'welcome' || !view ? '380px' : '90vh',
            sm: view === 'welcome' || !view ? '420px' : '85vh',
            md: '750px'
          },
          maxHeight: '800px',
          borderRadius: '24px',
          boxSizing: 'border-box',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 2000,
            p: 0
          }}
        >
          <CloseIcon />
        </IconButton>
        <WelcomeContent />
        {view === "signup" && <SignUp />}
        {view === "login" && <Login />}
        {view === "otp" && <VerifyOTP />}
      </Box>
    </Modal>
  );
};

export default AuthModal;