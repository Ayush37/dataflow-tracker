// services/api.js
import axios from 'axios';
import { USE_MOCKS, mockFlows, mockFlowDefinitions, mockStatusData, addMockFlow } from '../mocks';


const API_BASE_URL = '/api';

// Get list of available flows
export const fetchFlows = async () => {
  if (USE_MOCKS) {
    console.log("Using mock data for flows");
    return mockFlows;
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/flows/`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching flows:', error);
    return [];
  }
};

// Get flow definition by name
export const fetchFlowDefinition = async (flowName) => {
  if (USE_MOCKS) {
    console.log(`Using mock data for flow definition: ${flowName}`);
    return mockFlowDefinitions[flowName] || null;
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/flows/${flowName}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching flow ${flowName}:`, error);
    throw error;
  }
};

// Get current status for a flow
export const fetchFlowStatus = async (flowName) => {
  if (USE_MOCKS) {
    console.log(`Using mock data for flow status: ${flowName}`);
    return mockStatusData[flowName] || null;
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/status/${flowName}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching status for ${flowName}:`, error);
    throw error;
  }
};

// Get list of available configurations
export const fetchConfigs = async () => {
  if (USE_MOCKS) {
    console.log("Using mock data for configs");
    return Object.keys(mockFlowDefinitions).map(name => `${name.toLowerCase()}.json`);
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/configs/`);
    return response.data.configs;
  } catch (error) {
    console.error('Error fetching configurations:', error);
    throw error;
  }
};

// Upload flow configuration
// export const uploadFlowConfig = async (configData) => {
//   if (USE_MOCKS) {
//     console.log("Mock: Upload flow config", configData);
//     return { status: "success", message: "Configuration uploaded (mock)" };
//   }
  
//   try {
//     let response;
    
//     if (configData instanceof File) {
//       // Upload file
//       const formData = new FormData();
//       formData.append('file', configData);
      
//       response = await axios.post(`${API_BASE_URL}/configs/`, formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data'
//         }
//       });
//     } else {
//       // Upload JSON object
//       response = await axios.post(`${API_BASE_URL}/configs/`, configData);
//     }
    
//     return response.data;
//   } catch (error) {
//     console.error('Error uploading configuration:', error);
//     throw error;
//   }
// };

export const uploadFlowConfig = async (configData) => {
  if (USE_MOCKS) {
    console.log("Mock: Upload flow config");
    
    try {
      let configJson;
      
      if (configData instanceof File) {
        // Read the file
        const fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsText(configData);
        });
        
        // Parse JSON from file
        configJson = JSON.parse(fileContent);
      } else {
        // Directly use the object
        configJson = configData;
      }
      
      // Process the configuration
      const success = addMockFlow(configJson);
      
      if (success) {
        return { 
          status: "success", 
          message: `Flow ${configJson.flowName} created successfully`
        };
      } else {
        throw new Error("Failed to process flow configuration");
      }
    } catch (error) {
      console.error("Error processing mock flow:", error);
      throw error;
    }
  }
  
  // Original code for non-mock mode
  try {
    let response;
    
    if (configData instanceof File) {
      // Upload file
      const formData = new FormData();
      formData.append('file', configData);
      
      response = await axios.post(`${API_BASE_URL}/configs/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } else {
      // Upload JSON object
      response = await axios.post(`${API_BASE_URL}/configs/`, configData);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error uploading configuration:', error);
    throw error;
  }
};
