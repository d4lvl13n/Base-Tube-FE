import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { SignInWeb3UI } from './Styles';

const SignInWeb3 = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.onboarding_status === 'PENDING') {
        navigate('/onboarding/web3', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return <SignInWeb3UI />;
};

export default SignInWeb3; 