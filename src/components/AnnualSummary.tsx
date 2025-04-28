import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { DailyEntry } from '../types/bankroll';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnnualSummaryProps {
  entries: DailyEntry[];
}

const AnnualSummary: React.FC<AnnualSummaryProps> = ({ entries }) => {
  const chartData = useMemo(() => {
    // Group entries by month
    const monthlyData = entries.reduce((acc: Record<string, number>, entry) => {
      const date = new Date(entry.date);
      const month = date.toLocaleString('default', { month: 'long' });
      
      if (!acc[month]) {
        acc[month] = 0;
      }
      
      acc[month] += entry.result;
      return acc;
    }, {});

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentMonth = new Date().getMonth();
    const relevantMonths = months.slice(0, currentMonth + 1);
    
    // Fill in missing months with zero
    const labels = relevantMonths.length ? relevantMonths : months;
    const data = labels.map(month => monthlyData[month] || 0);
    
    // Calculate cumulative results
    let cumulativeTotal = 0;
    const cumulativeData = data.map(value => {
      cumulativeTotal += value;
      return cumulativeTotal;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Monthly Result',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointRadius: 4,
          tension: 0.2,
          yAxisID: 'y',
        },
        {
          label: 'Cumulative Profit',
          data: cumulativeData,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointRadius: 4,
          tension: 0.2,
          fill: true,
          yAxisID: 'y1',
        }
      ]
    };
  }, [entries]);

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Monthly Result ($)'
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Cumulative Profit ($)'
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'USD' 
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    animation: {
      duration: 1000,
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Annual Performance</h2>
      </div>
      
      <div className="p-4">
        {entries.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No data available yet. Add your first daily entry to see performance charts.
          </div>
        ) : (
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnualSummary;