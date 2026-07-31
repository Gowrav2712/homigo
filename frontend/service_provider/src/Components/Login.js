import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { useWelcomeViewContext } from "../Contexts/WelcomeViewContextProvider";
import { Typography, TextField, Button, Box, Link, Alert, CircularProgress, IconButton, InputAdornment } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import ForgotPasswordModal from './ForgotPasswordModal';
import { useNavigate } from 'react-router-dom';
import { requestAndStoreLocation } from "../utils/LocationHandler";

const Login = () => {
  const { setEmpty, showSignUp } = useWelcomeViewContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

  const validateEmail = (email) => {
    if(!email) return 'Email is required';
    if(!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if(name === 'email') setEmailError(validateEmail(value));

    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleReset = () => {
    setFormData({ email: '', password: '' });
    setEmailError('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailValidationError = validateEmail(formData.email);
    if(emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/service_providers/login/`, formData);

      if(response.data.status) {
        localStorage.setItem('accessToken', response.data.data.access_token);
        localStorage.setItem('refreshToken', response.data.data.refresh_token);
        localStorage.setItem('providerId', response.data.data.provider_id);
        localStorage.setItem('providerName', response.data.data.name);
        localStorage.setItem('providerEmail', response.data.data.email);
        localStorage.setItem('mainServiceId', response.data.data.service_id);

        await requestAndStoreLocation(
          () => {}, // Success callback
          (errorMsg) => setError(`Login successful but ${errorMsg}. You can update location later.`)
        );

        navigate('/main');
      } 
      else setError(response.data.message);
    } 
    catch(err) {
      setError(
        err.response?.data?.errors?.non_field_errors?.[0] ||
        err.response?.data?.message ||
        'An error occurred during login'
      );
    } 
    finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        height: '100%',
        width: { xs: '100%', md: '50%' },
        bgcolor: 'background.light',
        padding: '2rem',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.1)',
        '@keyframes slideIn': {
          from: {
            transform: 'translateX(100%)',
            opacity: 0,
          },
          to: {
            transform: 'translateX(0)',
            opacity: 1,
          },
        },
        animation: 'slideIn 0.5s ease-out forwards'
      }}
    >
      <CloseIcon
        onClick={setEmpty}
        sx={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          cursor: 'pointer'
        }}
      />

      <Typography variant="h4" sx={{ mb: 2, color: 'primary.main' }}>
        Login
      </Typography>

      <Box sx={{ width: '100%', maxWidth: '400px' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={!!emailError}
          helperText={emailError}
          required
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          required
          fullWidth
          sx={{ mb: 3 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || !!emailError || !formData.email || !formData.password}
          >
            {
              loading ? 
              <>
                <CircularProgress size={24} color="inherit" />
                <Typography ml={1}>logging in...</Typography>
              </> :
              'Login'
            }
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{ minWidth: '100px' }}
          >
            Reset
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Link
            component="button"
            type="button"
            onClick={() => setForgotPasswordOpen(true)}
            sx={{ color: 'primary.main', fontSize: '0.9rem', textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            Forgot Password?
          </Link>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.muted' }}>
            Don't have an account?{' '}
            <Link
              component="button"
              type="button"
              onClick={showSignUp}
              sx={{ color: 'secondary.main' }}
            >
              SignUp
            </Link>
          </Typography>
        </Box>
      </Box>

      <ForgotPasswordModal
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </Box>
  );
};

export default Login;
