import React from 'react';

interface ExportColumnsSelectorProps {
  allColumns: string[];
  selectedColumns: string[];
  onChange: (next: string[]) => void;
}

const ExportColumnsSelector: React.FC<ExportColumnsSelectorProps> = ({ allColumns, selectedColumns, onChange }) => {
  const toggle = (col: string, checked: boolean) => {
    if (checked) onChange(Array.from(new Set([...selectedColumns, col])));
    else onChange(selectedColumns.filter((c) => c !== col));
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Columns</p>
      <div className="grid grid-cols-2 gap-2">
        {allColumns.map((col) => (
          <label key={col} className="text-sm text-gray-700 flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedColumns.includes(col)}
              onChange={(e) => toggle(col, e.target.checked)}
            />
            <span>{col}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ExportColumnsSelector;
