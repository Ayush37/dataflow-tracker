import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchFlowDefinition, fetchFlowStatus } from '../services/api';
import FlowVisualizer from '../components/FlowVisualizer';
import StatusPanel from '../components/StatusPanel';

const FlowDetails = () => {
  const { flowName } = useParams();
  const navigate = useNavigate();
  const [flowData, setFlowData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch flow definition
        const flowDefinition = await fetchFlowDefinition(flowName);
        setFlowData(flowDefinition);
        
        // Fetch current status
        const status = await fetchFlowStatus(flowName);
        setStatusData(status);
        
        setError(null);
      } catch (err) {
        console.error(err);
        setError(`Error loading flow: ${err.message}`);
        
        // If flow not found, redirect to 404
        if (err.response && err.response.status === 404) {
          navigate('/404');
        }
      } finally {
        setLoading(false);
      }
    };

    if (flowName) {
      loadData();
    }
  }, [flowName, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{flowName} Process Flow</h1>
        <p className="text-gray-600">
          {statusData && statusData.timestamp && (
            <>Last updated: {new Date(statusData.timestamp).toLocaleString()}</>
          )}
        </p>
      </div>
      
      <StatusPanel flowData={flowData} lastUpdated={statusData?.timestamp} />
      
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="h-[600px]">
          <FlowVisualizer />
        </div>
      </div>
    </div>
  );
};

export default FlowDetails;
