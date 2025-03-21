// src/mocks/flowData.js
export const mockFlows = [
  {
    name: "DERIV",
    nodeCount: 12,
    edgeCount: 15,
    categoryCount: 2
  },
  {
    name: "COLLATERAL",
    nodeCount: 8,
    edgeCount: 10,
    categoryCount: 2
  },
  {
    name: "SECURITIES",
    nodeCount: 6,
    edgeCount: 7,
    categoryCount: 1
  }
];

export const mockFlowDefinitions = {
  "DERIV": {
    name: "DERIV",
    definition: {
      nodes: [
        {
          id: "category-AWS",
          type: "category",
          data: {
            label: "AWS",
            stages: []
          },
          position: { x: 100, y: 100 },
          style: {
            width: 750,
            height: 400
          }
        },
        {
          id: "stage-AWS-Calculator_Runs",
          type: "stage",
          data: {
            label: "Calculator_Runs",
            category: "AWS",
            status: "running",
            subStages: [
              {
                id: "substage-AWS-Calculator_Runs-Stage_1_1",
                name: "Stage_1_1",
                type: "sequential",
                status: "completed"
              },
              {
                id: "substage-AWS-Calculator_Runs-Stage1_2",
                name: "Stage1_2",
                type: "sequential",
                status: "running"
              },
              {
                id: "substage-AWS-Calculator_Runs-Stage1_3",
                name: "Stage1_3",
                type: "sequential",
                status: "pending"
              }
            ]
          },
          position: { x: 50, y: 80 },
          parentNode: "category-AWS",
          extent: "parent"
        },
        {
          id: "stage-AWS-Translator_Runs",
          type: "stage",
          data: {
            label: "Translator_Runs",
            category: "AWS",
            status: "running",
            subStages: [
              {
                id: "substage-AWS-Calculator_Runs-Stage_1_1",
                name: "Stage_1_1",
                type: "sequential",
                status: "pending"
              },
              {
                id: "substage-AWS-Calculator_Runs-Stage1_2",
                name: "Stage1_2",
                type: "sequential",
                status: "pending"
              },
              {
                id: "substage-AWS-Calculator_Runs-Stage1_3",
                name: "Stage1_3",
                type: "sequential",
                status: "pending"
              }
            ]
          },
          position: { x: 50, y: 80 },
          parentNode: "category-AWS",
          extent: "parent"
        },	      
        {
          id: "stage-AWS-Cashflow_Generator",
          type: "stage",
          data: {
            label: "Cashflow_Generator",
            category: "AWS",
            status: "pending",
            subStages: [
              {
                id: "substage-AWS-Cashflow_Generator-Stage_2",
                name: "Stage_2",
                type: "single",
                status: "pending"
              }
            ]
          },
          position: { x: 200, y: 80 },
          parentNode: "category-AWS",
          extent: "parent"
        },
        {
          id: "category-On-PREM",
          type: "category",
          data: {
            label: "On-PREM",
            stages: []
          },
          position: { x: 700, y: 100 },
          style: {
            width: 500,
            height: 400
          }
        },
        {
          id: "stage-On-PREM-BPF",
          type: "stage",
          data: {
            label: "BPF",
            category: "On-PREM",
            status: "pending",
            subStages: [
              {
                id: "substage-On-PREM-BPF-Stage5_1",
                name: "Stage5_1",
                type: "parallel",
                status: "pending"
              },
              {
                id: "substage-On-PREM-BPF-Stage5_2",
                name: "Stage5_2",
                type: "parallel",
                status: "pending"
              }
            ]
          },
          position: { x: 50, y: 80 },
          parentNode: "category-On-PREM",
          extent: "parent"
        },
        {
          id: "stage-On-PREM-FINAL_STAGE",
          type: "stage",
          data: {
            label: "FINAL_STAGE",
            category: "On-PREM",
            status: "pending",
            subStages: [
              {
                id: "substage-On-PREM-FINAL_STAGE-Stage6_1",
                name: "Stage6_1",
                type: "single",
                status: "pending"
              }
            ]
          },
          position: { x: 200, y: 80 },
          parentNode: "category-On-PREM",
          extent: "parent"
        }
      ],
      edges: [
        {
          id: "edge-stage-AWS-Calculator_Runs-stage-AWS-Cashflow_Generator",
          source: "stage-AWS-Calculator_Runs",
          target: "stage-AWS-Cashflow_Generator",
          animated: true,
          type: "smoothstep"
        },
        {
          id: "edge-stage-AWS-Cashflow_Generator-stage-On-PREM-BPF",
          source: "stage-AWS-Cashflow_Generator",
          target: "stage-On-PREM-BPF",
          animated: true,
          type: "smoothstep"
        },
        {
          id: "edge-stage-On-PREM-BPF-stage-On-PREM-FINAL_STAGE",
          source: "stage-On-PREM-BPF",
          target: "stage-On-PREM-FINAL_STAGE",
          animated: true,
          type: "smoothstep"
        }
      ],
      categories: {
        "AWS": [
          "stage-AWS-Calculator_Runs",
          "stage-AWS-Cashflow_Generator"
        ],
        "On-PREM": [
          "stage-On-PREM-BPF",
          "stage-On-PREM-FINAL_STAGE"
        ]
      }
    },
    aws_mappings: {
      "Stage_1_1": "calculator_stage_1_dag",
      "Stage1_2": "calculator_stage_2_dag",
      "Stage1_3": "calculator_stage_3_dag",
      "Stage_2": "cashflow_generator_dag"
    },
    onprem_mappings: {
      "Stage5_1": {
        "bpf_id": 20010,
        "process_id": 10
      },
      "Stage5_2": {
        "bpf_id": 20007,
        "process_id": 10
      },
      "Stage6_1": {
        "bpf_id": 20020,
        "process_id": 10
      }
    },
    refresh_interval: 120
  },
  "COLLATERAL": {
    // Similar structure for TRADING flow
    name: "COLLATERAL",
    definition: {
      nodes: [
        // Nodes would go here
      ],
      edges: [
        // Edges would go here
      ],
      categories: {
        // Categories would go here
      }
    }
  },
  "SECURITIES": {
    // Similar structure for RECONCILIATION flow
    name: "SECURITIES",
    definition: {
      nodes: [
        // Nodes would go here
      ],
      edges: [
        // Edges would go here
      ],
      categories: {
        // Categories would go here
      }
    }
  }
};
