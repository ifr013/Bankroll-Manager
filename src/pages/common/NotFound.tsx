import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, Home } from 'lucide-react';

export default function NotFound() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-primary-100 rounded-full p-6 mb-6">
        <DollarSign size={48} className="text-primary-600" />
      </div>
      
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      
      <p className="text-gray-500 max-w-md text-center mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <Link 
        to={user?.role === 'admin' ? '/admin' : user?.role === 'player' ? '/player' : '/'}
        className="btn-primary flex items-center"
      >
        <Home size={18} className="mr-2" />
        Back to Dashboard
      </Link>
    </div>
  );
}