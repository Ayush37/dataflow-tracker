import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const StageNode = ({ data }) => {
  const getStatusColor = (status) => {
    const colors = {
      'running': '#10b981',
      'completed': '#3b82f6',
      'failed': '#ef4444',
      'pending': '#cbd5e1',
      'error': '#f97316',
      'unknown': '#9ca3af'
    };
    return colors[status.toLowerCase()] || colors.unknown;
  };
  
  const getStatusText = (status) => {
    return status ? status.toUpperCase() : 'UNKNOWN';
  };
  
  const getSubStageColor = (subStage) => {
    if (subStage.status) {
      return getStatusColor(subStage.status);
    }
    
    return data.status === 'running' ? '#3b82f6' : '#93c5fd';
  };

  return (
    <div
      className="rounded-md p-3 shadow-md"
      style={{
        backgroundColor: 'white',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: '#e2e8f0',
        width: '100%',
        minHeight: '100px'
      }}
    >
      <div className="font-bold text-md">{data.label}</div>
      
      {data.subStages && data.subStages.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.subStages.map((subStage, index) => (
            <div
              key={subStage.id || index}
              className="rounded text-xs px-2 py-1 text-white text-center"
              style={{ backgroundColor: getSubStageColor(subStage) }}
            >
              {subStage.name}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-center mt-2">
        <div
          className="w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: getStatusColor(data.status) }}
        ></div>
        <span className="text-xs font-medium">
          {getStatusText(data.status)}
        </span>
      </div>
      
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(StageNode);
