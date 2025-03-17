// pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchFlows } from '../services/api';

const Dashboard = () => {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFlows = async () => {
      try {
        setLoading(true);
        const data = await fetchFlows();
        setFlows(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError('Error loading flows. Please try again later.');
        console.error(err);
        setFlows([]); // Ensure flows is always an array
      } finally {
        setLoading(false);
      }
    };

    loadFlows();
  }, []);

  const renderFlowCards = () => {
    if (!Array.isArray(flows) || flows.length === 0) {
      return (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-xl font-semibold mb-4">No Batch Processes Found</h2>
          <p className="text-gray-600 mb-6">Get started by adding your first batch process.</p>
          <Link
            to="/new"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            Add New Process
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flows.map((flow) => (
          <Link
            key={flow.name}
            to={`/flows/${flow.name}`}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{flow.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <span className="text-gray-500">Stages:</span>
                <div className="font-medium">{flow.nodeCount || 0}</div>
              </div>
              <div>
                <span className="text-gray-500">Categories:</span>
                <div className="font-medium">{flow.categoryCount || 0}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Batch Process Dashboard</h1>
        <Link
          to="/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add New Process
        </Link>
      </div>

      {renderFlowCards()}
    </div>
  );
};

export default Dashboard;
