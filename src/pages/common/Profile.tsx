import { useState, FormEvent } from 'react';
import { ArrowLeft, User, Save, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const handleUpdateProfile = (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    
    // Simulate API call
    setTimeout(() => {
      setMessage('Profile updated successfully');
      setIsSaving(false);
    }, 1000);
  };
  
  const handleUpdatePassword = (e: FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('New password and confirmation do not match');
      return;
    }
    
    setIsSaving(true);
    setMessage('');
    
    // Simulate API call
    setTimeout(() => {
      setMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSaving(false);
    }, 1000);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Profile" />
      
      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/player')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </button>
        
        <div className="flex items-center mb-8">
          <div className="bg-primary-100 h-16 w-16 rounded-full flex items-center justify-center mr-4">
            <User size={32} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{user?.name}</h1>
            <p className="text-gray-500">
              {user?.role === 'admin' ? 'Administrator' : 'Player'}
            </p>
          </div>
        </div>
        
        {message && (
          <div className="bg-success-100 text-success-800 p-4 rounded-md mb-6 animate-fade-in">
            {message}
          </div>
        )}
        
        <div className="card mb-6">
          <div className="flex items-center mb-6">
            <User size={20} className="text-gray-400 mr-2" />
            <h2 className="text-xl font-semibold">Personal Information</h2>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary py-2"
            >
              <Save size={16} className="mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
        
        <div className="card">
          <div className="flex items-center mb-6">
            <Lock size={20} className="text-gray-400 mr-2" />
            <h2 className="text-xl font-semibold">Change Password</h2>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary py-2"
            >
              <Save size={16} className="mr-2" />
              {isSaving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}