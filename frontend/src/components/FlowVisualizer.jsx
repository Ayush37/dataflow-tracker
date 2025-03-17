// components/FlowVisualizer.jsx
import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams } from 'react-router-dom';
import { fetchFlowDefinition } from '../services/api';
import { setupWebSocket } from '../services/websocket';
import CategoryNode from './nodes/CategoryNode';
import StageNode from './nodes/StageNode';

// Custom node types for rendering
const nodeTypes = {
  category: CategoryNode,
  stage: StageNode
};

const FlowVisualizer = () => {
  const { flowName } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load flow definition
  useEffect(() => {
    const loadFlow = async () => {
      try {
        setLoading(true);
        const flowData = await fetchFlowDefinition(flowName);
        
        if (flowData && flowData.definition) {
          setNodes(flowData.definition.nodes || []);
          setEdges(flowData.definition.edges || []);
          setLastUpdated(new Date());
          setError(null);
        } else {
          setError('Invalid flow data received');
        }
      } catch (err) {
        setError(`Error loading flow: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (flowName) {
      loadFlow();
    }
  }, [flowName, setNodes, setEdges]);

  // Set up WebSocket for real-time updates
  useEffect(() => {
    if (!flowName) return;

    const handleStatusUpdate = (data) => {
      if (data.flowName !== flowName) return;

      // Update node status based on received data
      setNodes((currentNodes) => {
        return currentNodes.map(node => {
          if (node.type === 'stage') {
            const stageName = node.data.label;
            
            if (data.stages && data.stages[stageName]) {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: data.stages[stageName].status,
                  startTime: data.stages[stageName].start_time,
                  endTime: data.stages[stageName].end_time,
                  details: data.stages[stageName].details
                }
              };
            }
            
            // Also update substages if present
            if (node.data.subStages && node.data.subStages.length > 0) {
              const updatedSubStages = node.data.subStages.map(subStage => {
                const subStageName = subStage.name;
                if (data.stages && data.stages[subStageName]) {
                  return {
                    ...subStage,
                    status: data.stages[subStageName].status
                  };
                }
                return subStage;
              });
              
              return {
                ...node,
                data: {
                  ...node.data,
                  subStages: updatedSubStages
                }
              };
            }
          }
          return node;
        });
      });
      
      setLastUpdated(new Date(data.timestamp));
    };

    const ws = setupWebSocket(flowName, handleStatusUpdate);
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [flowName, setNodes]);

  const onLayout = useCallback(() => {
    // You could implement different layout algorithms here
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading flow visualization...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
        <Panel position="top-right">
          <div className="bg-white p-2 rounded shadow">
            {lastUpdated && (
              <div className="text-sm text-gray-600">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <button
              onClick={onLayout}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm mt-1"
            >
              Layout
            </button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default FlowVisualizer;

