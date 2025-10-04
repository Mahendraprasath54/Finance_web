import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '../common/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  labels: string[];
  values: number[];
  title?: string;
  onElementClick?: (index: number, label: string, value: number) => void;
}

const colors = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
];

const DoughnutChart: React.FC<Props> = ({ labels, values, title, onElementClick }) => {
  const { darkMode } = useTheme();
  const data = {
    labels,
    datasets: [
      {
        label: title || 'Distribution',
        data: values,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false as const,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: darkMode ? '#e5e7eb' : '#374151' } },
      tooltip: { enabled: true, titleColor: darkMode ? '#e5e7eb' : '#111827', bodyColor: darkMode ? '#e5e7eb' : '#111827', backgroundColor: darkMode ? 'rgba(31,41,55,0.9)' : 'rgba(255,255,255,0.95)', borderColor: darkMode ? '#374151' : '#e5e7eb', borderWidth: 1 },
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

  return <Doughnut data={data} options={options} onClick={handleClick as any} />;
};

export default DoughnutChart;
