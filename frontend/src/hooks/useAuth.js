import { useContext } from 'react';
import { AuthContext, AuthProvider } from '../context/AuthContext';

const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  
  return context;
};

export default useAuth;

// Ré-exporter AuthProvider pour pouvoir l'importer depuis useAuth
export { AuthProvider };