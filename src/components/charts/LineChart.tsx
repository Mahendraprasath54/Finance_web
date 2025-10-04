import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../common/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface Props {
  labels: string[];
  values: number[];
  title?: string;
  forecastValues?: number[]; // optional secondary dataset (e.g., SMA/forecast)
  forecastLabel?: string; // label for the secondary dataset
  showPoints?: boolean; // optional toggle to show/hide data points
  onElementClick?: (index: number, label: string, value: number) => void; // optional drill-down
}

const LineChart: React.FC<Props> = ({ labels, values, title, forecastValues, forecastLabel = 'Forecast', showPoints = true, onElementClick }) => {
  const { darkMode } = useTheme();
  const data = {
    labels,
    datasets: [
      {
        label: title || 'Series',
        data: values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: showPoints ? 3 : 0,
        pointHoverRadius: showPoints ? 4 : 0,
      },
      ...(forecastValues && forecastValues.length === values.length
        ? [{
            label: forecastLabel,
            data: forecastValues,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            fill: false,
            tension: 0.3,
            borderDash: [6, 6],
            pointRadius: 0,
            pointHoverRadius: 0,
          }]
        : []),
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: {
      legend: { display: !!title, labels: { color: darkMode ? '#e5e7eb' : '#374151' } },
      tooltip: { enabled: true, titleColor: darkMode ? '#e5e7eb' : '#111827', bodyColor: darkMode ? '#e5e7eb' : '#111827', backgroundColor: darkMode ? 'rgba(31,41,55,0.9)' : 'rgba(255,255,255,0.95)', borderColor: darkMode ? '#374151' : '#e5e7eb', borderWidth: 1 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: darkMode ? '#9ca3af' : '#6b7280' } },
      y: { grid: { color: darkMode ? '#374151' : '#f1f5f9' }, ticks: { color: darkMode ? '#9ca3af' : '#6b7280' } },
    },
  };

  const handleClick = (_evt: any, elements: any[]) => {
    if (!onElementClick || !elements || elements.length === 0) return;
    const el = elements[0];
    const index = el.index;
    const label = labels[index];
    const value = values[index];
    onElementClick(index, label, value);
  };

  return <Line data={data} options={options} onClick={handleClick as any} />;
};

export default LineChart;
