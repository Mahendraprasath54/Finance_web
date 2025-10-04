import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../common/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  labels: string[];
  values: number[];
  title?: string;
  color?: string;
  onElementClick?: (index: number, label: string, value: number) => void;
}

const BarChart: React.FC<Props> = ({ labels, values, title, color = '#10b981', onElementClick }) => {
  const { darkMode } = useTheme();
  const data = {
    labels,
    datasets: [
      {
        label: title || 'Series',
        data: values,
        backgroundColor: color,
        borderRadius: 6,
      },
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

  return <Bar data={data} options={options} onClick={handleClick as any} />;
};

export default BarChart;
