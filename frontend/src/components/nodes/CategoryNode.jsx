import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CategoryNode = ({ data }) => {
  const getBgColor = (category) => {
    const colors = {
      'AWS': '#f0f4ff',
      'On-PREM': '#f0fff4',
      // Add more category colors as needed
    };
    return colors[category] || '#f7fafc';
  };
  
  const getBorderColor = (category) => {
    const colors = {
      'AWS': '#bfdbfe',
      'On-PREM': '#bfecde',
      // Add more category colors as needed
    };
    return colors[category] || '#e2e8f0';
  };

  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: getBgColor(data.label),
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: getBorderColor(data.label),
        width: '100%',
        height: '100%'
      }}
    >
      <div className="font-bold text-lg mb-2">{data.label}</div>
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};

export default memo(CategoryNode);
