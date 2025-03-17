// src/mocks/statusData.js
export const mockStatusData = {
  "DERIV": {
    flow_name: "DERIV",
    timestamp: new Date().toISOString(),
    status: {
      "Stage_1_1": {
        status: "completed",
        start_time: "2025-03-17T08:00:00Z",
        end_time: "2025-03-17T08:15:00Z",
        details: {}
      },
      "Stage1_2": {
        status: "running",
        start_time: "2025-03-17T08:15:00Z",
        end_time: null,
        details: {}
      },
      "Stage1_3": {
        status: "pending",
        start_time: null,
        end_time: null,
        details: {}
      },
      "Stage_2": {
        status: "pending",
        start_time: null,
        end_time: null,
        details: {}
      },
      "Stage5_1": {
        status: "pending",
        start_time: null,
        end_time: null,
        details: {}
      },
      "Stage5_2": {
        status: "pending",
        start_time: null,
        end_time: null,
        details: {}
      },
      "Stage6_1": {
        status: "pending",
        start_time: null,
        end_time: null,
        details: {}
      }
    }
  }
};
