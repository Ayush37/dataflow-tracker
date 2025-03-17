// services/websocket.js
import { USE_MOCKS, mockStatusData } from '../mocks';

let websocket = null;
let mockInterval = null;

export const setupWebSocket = (flowName, onMessage) => {
  // If using mocks, set up a simulated WebSocket with interval updates
  if (USE_MOCKS) {
    console.log(`Setting up mock WebSocket for ${flowName}`);
    
    // Clear any existing mock interval
    if (mockInterval) {
      clearInterval(mockInterval);
    }
    
    // Create a mock WebSocket that sends updates every 5 seconds
    mockInterval = setInterval(() => {
      if (mockStatusData[flowName]) {
        // Update the timestamp
        const mockData = {
          ...mockStatusData[flowName],
          timestamp: new Date().toISOString()
        };
        
        // Simulate stage progression
        if (mockData.status['Stage1_2'] && mockData.status['Stage1_2'].status === 'running') {
          // Randomly complete Stage1_2 and start Stage1_3
          if (Math.random() > 0.7) {
            mockData.status['Stage1_2'].status = 'completed';
            mockData.status['Stage1_2'].end_time = new Date().toISOString();
            mockData.status['Stage1_3'].status = 'running';
            mockData.status['Stage1_3'].start_time = new Date().toISOString();
          }
        } else if (mockData.status['Stage1_3'] && mockData.status['Stage1_3'].status === 'running') {
          // Randomly complete Stage1_3 and start Stage_2
          if (Math.random() > 0.7) {
            mockData.status['Stage1_3'].status = 'completed';
            mockData.status['Stage1_3'].end_time = new Date().toISOString();
            mockData.status['Stage_2'].status = 'running';
            mockData.status['Stage_2'].start_time = new Date().toISOString();
          }
        }
        
        // Send the mock update
        onMessage(mockData);
      }
    }, 5000);
    
    return {
      close: () => {
        if (mockInterval) {
          clearInterval(mockInterval);
          mockInterval = null;
        }
      }
    };
  }
  
  // Regular WebSocket code for non-mock mode
  // Close existing connection if any
  if (websocket) {
    websocket.close();
  }
  
  // Determine WebSocket URL based on current window location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/${flowName}`;
  
  // Create new WebSocket connection
  websocket = new WebSocket(wsUrl);
  
  websocket.onopen = () => {
    console.log(`WebSocket connection established for ${flowName}`);
  };
  
  websocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage && typeof onMessage === 'function') {
        onMessage(data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  websocket.onclose = () => {
    console.log(`WebSocket connection closed for ${flowName}`);
    
    // Attempt to reconnect after a delay
    setTimeout(() => {
      if (websocket.readyState === WebSocket.CLOSED) {
        setupWebSocket(flowName, onMessage);
      }
    }, 5000);
  };
  
  return websocket;
};
