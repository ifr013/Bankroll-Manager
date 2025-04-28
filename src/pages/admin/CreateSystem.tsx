import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '../../components/layout/Header';
import useSystemsStore from '../../store/systemsStore';
import { useAuth } from '../../context/AuthContext';

export default function CreateSystem() {
  const { user } = useAuth();
  const createSystem = useSystemsStore(state => state.createSystem);
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [type, setType] = useState('STAKING 50/50');
  const [stakingPercentage, setStakingPercentage] = useState(50);
  const [isCreating, setIsCreating] = useState(false);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsCreating(true);
    
    try {
      const systemId = createSystem({
        name,
        type,
        stakingPercentage,
        adminId: user.id
      });
      
      // Navigate to the newly created system
      navigate(`/admin/systems/${systemId}`);
    } catch (error) {
      console.error('Error creating system:', error);
      setIsCreating(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Create New System" />
      
      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </button>
        
        <div className="card">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create New System</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                System Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="e.g., High Stakes Poker Team"
                required
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                System Type *
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input"
                required
              >
                <option value="STAKING 50/50">Staking 50/50</option>
                <option value="STAKING 70/30">Staking 70/30</option>
                <option value="FULL STAKING">Full Staking</option>
                <option value="MAKEUP TEAM">Makeup Team</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="stakingPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                Staking Percentage *
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="stakingPercentage"
                  value={stakingPercentage}
                  onChange={(e) => setStakingPercentage(Number(e.target.value))}
                  className="input"
                  min="1"
                  max="100"
                  required
                />
                <span className="ml-2 text-gray-500">%</span>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary w-full py-3"
              >
                {isCreating ? 'Creating System...' : 'Create System'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}