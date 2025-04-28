import { useState, FormEvent } from 'react';
import { DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type LoginType = 'admin' | 'player1' | 'player2' | 'player3';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Helper to show login hint buttons
  const handleQuickLogin = (type: LoginType) => {
    switch (type) {
      case 'admin':
        setEmail('admin@example.com');
        break;
      case 'player1':
        setEmail('john@example.com');
        break;
      case 'player2':
        setEmail('alice@example.com');
        break;
      case 'player3':
        setEmail('bob@example.com');
        break;
    }
    setPassword('password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-primary-100 rounded-full p-3">
              <DollarSign size={32} className="text-primary-600" />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Poker Bankroll Manager</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input rounded-t-md rounded-b-none"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input rounded-t-none rounded-b-md"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="text-danger-600 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn-primary w-full py-3"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <p className="text-gray-500 mb-2">Demo Accounts (Click to fill)</p>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="btn-secondary text-xs py-1"
              >
                Admin Login
              </button>
              <button 
                type="button"
                onClick={() => handleQuickLogin('player1')}
                className="btn-secondary text-xs py-1"
              >
                John (Player)
              </button>
              <button 
                type="button"
                onClick={() => handleQuickLogin('player2')}
                className="btn-secondary text-xs py-1"
              >
                Alice (Player)
              </button>
              <button 
                type="button"
                onClick={() => handleQuickLogin('player3')}
                className="btn-secondary text-xs py-1"
              >
                Bob (Player)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}