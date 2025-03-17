// components/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { fetchFlows } from '../services/api';

const Sidebar = () => {
  const [flows, setFlows] = useState([]);  // Initialize as empty array
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFlows = async () => {
      try {
        const data = await fetchFlows();
        // Make sure we set an array, even if the API returns null or undefined
        if (data && Array.isArray(data)) {
          setFlows(data);
        } else {
          console.warn("API did not return an array:", data);
          setFlows([]);
        }
      } catch (error) {
        console.error('Error loading flows:', error);
        setFlows([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadFlows();
  }, []);

  const renderFlowItems = () => {
    if (!Array.isArray(flows) || flows.length === 0) {
      return <li className="text-sm text-gray-500">No batch processes found</li>;
    }

    return flows.map((flow) => {
      if (!flow || typeof flow !== 'object' || !flow.name) {
        return null; // Skip invalid items
      }
      
      return (
        <li key={flow.name} className="mb-2">
          <NavLink
            to={`/flows/${flow.name}`}
            className={({ isActive }) =>
              `block p-2 rounded ${
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'text-blue-900 hover:bg-blue-100'
              }`
            }
          >
            {flow.name}
          </NavLink>
        </li>
      );
    });
  };

  return (
    <aside className="w-64 bg-gray-100 p-4 overflow-auto border-r">
      <h2 className="text-lg font-semibold mb-4">Batch Processes</h2>
      
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <nav>
          <ul>
            {renderFlowItems()}
          </ul>
          <div className="border-t border-gray-300 my-4"></div>
          <NavLink
            to="/new"
            className={({ isActive }) =>
              `block p-2 rounded ${
                isActive
                  ? 'bg-green-500 text-white'
                  : 'text-green-700 hover:bg-green-100'
              }`
            }
          >
            Add New Process
          </NavLink>
        </nav>
      )}
    </aside>
  );
};

export default Sidebar;
