import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'player';
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for saved user on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Mock login function - would connect to a real API in production
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simulated API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Mock users database
          const users = {
            'admin@example.com': {
              id: '1',
              name: 'Admin User',
              email: 'admin@example.com',
              role: 'admin' as const,
              password: 'password'
            },
            'john@example.com': {
              id: 'player1',
              name: 'John Doe',
              email: 'john@example.com',
              role: 'player' as const,
              password: 'password'
            },
            'alice@example.com': {
              id: 'player3',
              name: 'Alice Smith',
              email: 'alice@example.com',
              role: 'player' as const,
              password: 'password'
            },
            'bob@example.com': {
              id: 'player4',
              name: 'Bob Wilson',
              email: 'bob@example.com',
              role: 'player' as const,
              password: 'password'
            }
          };

          const user = users[email as keyof typeof users];
          
          if (user && user.password === password) {
            const { password: _, ...userWithoutPassword } = user;
            resolve(userWithoutPassword);
          } else {
            if (!email.includes('@')) {
              reject(new Error('Please enter a valid email address'));
            } else if (!password) {
              reject(new Error('Password is required'));
            } else {
              reject(new Error('Invalid email or password. Please try again.'));
            }
          }
        }, 800);
      }).then((mockUser: User) => {
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        navigate(mockUser.role === 'admin' ? '/admin' : '/player');
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}