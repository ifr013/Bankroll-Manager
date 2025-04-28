import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCircle } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
          Poker Bankroll Manager
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate('/players')}
            className="w-full flex items-center justify-center px-8 py-6 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 md:py-8 md:text-lg md:px-10 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Users className="w-6 h-6 mr-3" />
            Players Overview
            <span className="ml-2 text-sm opacity-75">(Quick View)</span>
          </button>

          <button
            onClick={() => navigate('/bankroll')}
            className="w-full flex items-center justify-center px-8 py-6 border border-transparent text-base font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 md:py-8 md:text-lg md:px-10 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserCircle className="w-6 h-6 mr-3" />
            Player Dashboard
            <span className="ml-2 text-sm opacity-75">(View Your Stats)</span>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Choose an option to continue
        </p>
      </div>
    </div>
  );
};

export default LandingPage;