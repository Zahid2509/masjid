import React from 'react';

const SourceBreakdown = ({ data }) => {
  const getSourceLabel = (source) => {
    return source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSourceColor = (index) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[index % colors.length];
  };

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Sources</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.source} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getSourceColor(index) }}
              />
              <span className="text-sm font-medium text-gray-700">
                {getSourceLabel(item.source)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-900">
                {item.count}
              </span>
              <span className="text-sm text-gray-500">
                ({item.percentage}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceBreakdown; 