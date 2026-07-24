import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useWelcomeViewContext } from '../Contexts/WelcomeViewContextProvider';

const ProtectedRoute = ({ component: Component }) => {
  const isAuthenticated = !!localStorage.getItem('accessToken');
  const { handleOpenAuthModal } = useWelcomeViewContext();

  useEffect(() => {
    if (!isAuthenticated) {
      handleOpenAuthModal();
    }
  }, [isAuthenticated, handleOpenAuthModal]);

  return isAuthenticated ? <Component /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;