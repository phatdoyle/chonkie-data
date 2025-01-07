import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChonkData {
  dailyChonkTransfers: {
    items: Array<{ id: string; totalTransfers: number }>;
  };
  topChonkHolders: {
    items: Array<{ id: string; totalChonks: number }>;
  };
  dailyChonkTraitTransfers: {
    items: Array<{ id: string; totalTraitsTransfers: number }>;
  };
}

const tableStyles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '1rem',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
  },
  th: {
    backgroundColor: '#f5f5f5',
    padding: '12px',
    textAlign: 'left' as const,
    borderBottom: '2px solid #ddd',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ddd',
  },
  tr: {
    '&:hover': {
      backgroundColor: '#f8f8f8',
    },
  },
};

export function ChonkieCharts() {
  const [data, setData] = useState<ChonkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [dateRange, setDateRange] = useState<[number, number]>([0, 100]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://api.ghostlogs.xyz/gg/pub/99727ea0-a98b-494c-ae7d-0cc2ae12333b/ghostgraph",
          {
            headers: {
              "X-GHOST-KEY": "3qt9k7e7ejw831m98qgvjs",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              query: `
                query ChonkieStats {
                  dailyChonkTransfers {
                    items {
                      id
                      totalTransfers
                    }
                  }
                  topChonkHolders(orderBy: "totalChonks", orderDirection: "desc", limit: 20) {
                    items {
                      id
                      totalChonks
                    }
                  }
                  dailyChonkTraitTransfers {
                    items {
                      id
                      totalTraitsTransfers
                    }
                  }
                }
              `
            }),
            method: "POST",
          }
        );
        const result = await response?.json() || [];
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatEpochToDate = (epoch: string) => {
    const timestamp = parseInt(epoch) * 1000;
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) return <div>Loading charts...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: windowWidth < 768 ? 1 : 1.75,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#333',
          boxWidth: 20,
          padding: windowWidth < 768 ? 10 : 20,
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#333'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        ticks: {
          color: '#333',
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: windowWidth < 768 ? 6 : 10
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  const allDates = data.dailyChonkTransfers.items.map(item => parseInt(item.id));
  const minDate = Math.min(...allDates);
  const maxDate = Math.max(...allDates);

  const filterDataByDateRange = (items: any[], dateRange: [number, number]) => {
    const [start, end] = dateRange;
    const startDate = minDate + (maxDate - minDate) * (start / 100);
    const endDate = minDate + (maxDate - minDate) * (end / 100);
    
    return items.filter(item => {
      const date = parseInt(item.id);
      return date >= startDate && date <= endDate;
    });
  };

  const dailyTransfersData = {
    labels: filterDataByDateRange(data.dailyChonkTransfers.items, dateRange)
      .map(item => formatEpochToDate(item.id)),
    datasets: [{
      label: 'Daily Chonk Transfers',
      data: filterDataByDateRange(data.dailyChonkTransfers.items, dateRange)
        .map(item => item.totalTransfers),
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      tension: 0.1
    }]
  };

  const traitTransfersData = {
    labels: filterDataByDateRange(data.dailyChonkTraitTransfers.items, dateRange)
      .map(item => formatEpochToDate(item.id)),
    datasets: [{
      label: 'Daily Trait Transfers',
      data: filterDataByDateRange(data.dailyChonkTraitTransfers.items, dateRange)
        .map(item => item.totalTraitsTransfers),
      borderColor: '#F44336',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      tension: 0.1
    }]
  };

  const renderTopHoldersTable = () => {
    return (
      <table style={tableStyles.table}>
        <thead>
          <tr>
            <th style={tableStyles.th}>Rank</th>
            <th style={tableStyles.th}>Holder ID</th>
            <th style={tableStyles.th}>Total Chonks</th>
          </tr>
        </thead>
        <tbody>
          {data?.topChonkHolders.items.map((holder, index) => (
            <tr key={holder.id} style={tableStyles.tr}>
              <td style={tableStyles.td}>{index + 1}</td>
              <td style={tableStyles.td}>{holder.id}</td>
              <td style={tableStyles.td}>{holder.totalChonks.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '100%', 
      margin: '0 auto',
      padding: windowWidth < 768 ? '0.5rem' : '1rem',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
        gap: windowWidth < 768 ? '0.5rem' : '1rem',
        marginBottom: windowWidth < 768 ? '1rem' : '2rem',
        width: '100%'
      }}>
        <div className="chart-container">
          <Line data={dailyTransfersData} options={options} />
        </div>
        
        <div className="chart-container">
          <Line data={traitTransfersData} options={options} />
        </div>

        <div className="slider-container" style={{ 
          gridColumn: '1 / -1' // This makes it span across all columns
        }}>
          <h3>Date Range</h3>
          <Slider
            range
            defaultValue={[0, 100]}
            value={dateRange}
            onChange={(value) => setDateRange(value as [number, number])}
            marks={{
              0: formatEpochToDate(minDate.toString()),
              100: formatEpochToDate(maxDate.toString())
            }}
          />
        </div>
      </div>
      
      <div className="chart-container">
        <h2>Top Chonk Holders</h2>
        {renderTopHoldersTable()}
      </div>
    </div>
  );
} 