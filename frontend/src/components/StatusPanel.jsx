import React from 'react';
import { format } from 'date-fns';

const StatusPanel = ({ flowData, lastUpdated }) => {
  if (!flowData) return null;

  const getStatusCount = (status) => {
    return flowData.definition.nodes.filter(
      node => node.type === 'stage' && node.data.status === status
    ).length;
  };

  const totalStages = flowData.definition.nodes.filter(
    node => node.type === 'stage'
  ).length;

  const statuses = {
    running: getStatusCount('running'),
    completed: getStatusCount('completed'),
    failed: getStatusCount('failed'),
    pending: getStatusCount('pending'),
    unknown: getStatusCount('unknown')
  };

  const getStatusColor = (status) => {
    const colors = {
      'running': 'bg-green-500',
      'completed': 'bg-blue-500',
      'failed': 'bg-red-500',
      'pending': 'bg-gray-300',
      'unknown': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-300';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h2 className="text-lg font-bold mb-3">Status Summary</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {Object.entries(statuses).map(([status, count]) => (
          <div key={status} className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center mb-1">
              <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(status)}`}></div>
              <span className="text-sm font-medium capitalize">{status}</span>
            </div>
            <div className="text-xl font-bold">{count}</div>
            <div className="text-xs text-gray-500">
              {Math.round((count / totalStages) * 100)}% of stages
            </div>
          </div>
        ))}
      </div>
      
      {lastUpdated && (
        <div className="text-sm text-gray-500">
          Last updated: {format(new Date(lastUpdated), 'MMM d, yyyy HH:mm:ss')}
        </div>
      )}
    </div>
  );
};

export default StatusPanel;      
