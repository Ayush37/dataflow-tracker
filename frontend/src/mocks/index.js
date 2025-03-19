// src/mocks/index.js
import { mockFlows, mockFlowDefinitions } from './flowData';
import { mockStatusData } from './statusData';

const USE_MOCKS = true; // Toggle for mock mode

// Add this function to handle mock uploads
const addMockFlow = (flowConfig) => {
  // Parse the uploaded file or JSON object
  const config = typeof flowConfig === 'string' ? JSON.parse(flowConfig) : flowConfig;
  
  // Add to mockFlowDefinitions
  mockFlowDefinitions[config.flowName] = {
    name: config.flowName,
    definition: {
      // Create a basic flow definition based on config
      nodes: [],
      edges: [],
      categories: {}
    },
    aws_mappings: config.stageMappings?.aws || {},
    onprem_mappings: config.stageMappings?.onPrem || {},
    refresh_interval: config.refreshInterval || 120
  };
  
  // Add to mockFlows list
  mockFlows.push({
    name: config.flowName,
    nodeCount: 0, // Will be populated later
    edgeCount: 0,
    categoryCount: Object.keys(config.flowDefinition?.subStages || {}).length
  });
  
  // Add an empty status entry
  mockStatusData[config.flowName] = {
    flow_name: config.flowName,
    timestamp: new Date().toISOString(),
    status: {}
  };
  
  // Parse and populate the flow definition
  try {
    const categories = {};
    const nodes = [];
    const edges = [];
    let nodeId = 0;
    
    // Process categories
    Object.keys(config.flowDefinition.subStages || {}).forEach((category, catIndex) => {
      const categoryId = `category-${category}`;
      categories[category] = [];
      
      // Add category node
      nodes.push({
        id: categoryId,
        type: "category",
        data: {
          label: category,
          stages: []
        },
        position: { x: 100 + (catIndex * 600), y: 100 },
        style: {
          width: 500,
          height: 400
        }
      });
      
      // Process stages in this category
      const stages = config.flowDefinition.subStages[category];
      Object.keys(stages).forEach((stageName, stageIndex) => {
        const stageId = `stage-${category}-${stageName}`;
        categories[category].push(stageId);
        
        // Parse substages
        const subStageStr = stages[stageName];
        const subStages = [];
        
        if (subStageStr.includes('->')) {
          // Sequential substages
          subStageStr.split('->').forEach((subStage) => {
            const trimmed = subStage.trim();
            subStages.push({
              id: `substage-${category}-${stageName}-${trimmed}`,
              name: trimmed,
              type: "sequential",
              status: "pending"
            });
          });
        } else if (subStageStr.includes(',')) {
          // Parallel substages
          subStageStr.split(',').forEach((subStage) => {
            const trimmed = subStage.trim();
            subStages.push({
              id: `substage-${category}-${stageName}-${trimmed}`,
              name: trimmed,
              type: "parallel",
              status: "pending"
            });
          });
        } else {
          // Single substage
          subStages.push({
            id: `substage-${category}-${stageName}-${subStageStr.trim()}`,
            name: subStageStr.trim(),
            type: "single",
            status: "pending"
          });
        }
        
        // Add stage node
        nodes.push({
          id: stageId,
          type: "stage",
          data: {
            label: stageName,
            category: category,
            status: "pending",
            subStages: subStages
          },
          position: { x: 50 + (stageIndex * 150), y: 80 },
          parentNode: categoryId,
          extent: "parent"
        });
        
        // Initialize status entries for each substage
        subStages.forEach(subStage => {
          mockStatusData[config.flowName].status[subStage.name] = {
            status: "pending",
            start_time: null,
            end_time: null,
            details: {}
          };
        });
      });
      
      // Add edges between stages in this category
      for (let i = 0; i < categories[category].length - 1; i++) {
        edges.push({
          id: `edge-${categories[category][i]}-${categories[category][i+1]}`,
          source: categories[category][i],
          target: categories[category][i+1],
          animated: true,
          type: "smoothstep"
        });
      }
    });
    
    // Add edges between categories based on overall flow
    let lastCategoryWithStages = null;
    Object.keys(categories).forEach(category => {
      if (categories[category].length > 0) {
        if (lastCategoryWithStages && categories[lastCategoryWithStages].length > 0) {
          edges.push({
            id: `edge-${categories[lastCategoryWithStages][categories[lastCategoryWithStages].length-1]}-${categories[category][0]}`,
            source: categories[lastCategoryWithStages][categories[lastCategoryWithStages].length-1],
            target: categories[category][0],
            animated: true,
            type: "smoothstep"
          });
        }
        lastCategoryWithStages = category;
      }
    });
    
    // Update the flow definition
    mockFlowDefinitions[config.flowName].definition = {
      nodes,
      edges,
      categories
    };
    
    // Update the flow summary
    const flowIndex = mockFlows.findIndex(f => f.name === config.flowName);
    if (flowIndex >= 0) {
      mockFlows[flowIndex].nodeCount = nodes.length;
      mockFlows[flowIndex].edgeCount = edges.length;
      mockFlows[flowIndex].categoryCount = Object.keys(categories).length;
    }
    
    return true;
  } catch (error) {
    console.error("Error processing flow config:", error);
    return false;
  }
};

export {
  USE_MOCKS,
  mockFlows,
  mockFlowDefinitions,
  mockStatusData,
  addMockFlow // Export the new function
};