import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { uploadFlowConfig } from '../services/api';

const FlowEditor = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flowDefinition, setFlowDefinition] = useState('');
  const [manualInput, setManualInput] = useState(false);
  const [formData, setFormData] = useState({
    flowName: '',
    refreshInterval: 120,
    databases: {
      aws: {
        host: '',
        user: '',
        password: '',
        database: ''
      },
      oracle: {
        host: '',
        user: '',
        password: '',
        service: ''
      }
    },
    flowDefinition: {
      overall: '',
      subStages: {}
    },
    stageMappings: {
      aws: {},
      onPrem: {}
    }
  });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
    
  //   try {
  //     setLoading(true);
      
  //     if (manualInput) {
  //       // Submit manual input
  //       const response = await uploadFlowConfig(formData);
  //       if (response.status === 'success') {
  //         toast.success(`Flow ${formData.flowName} created successfully`);
  //         navigate(`/flows/${formData.flowName}`);
  //       } else {
  //         toast.error('Failed to create flow configuration');
  //       }
  //     } else if (file) {
  //       // Submit file upload
  //       const response = await uploadFlowConfig(file);
  //       if (response.status === 'success') {
  //         toast.success(response.message);
  //         navigate('/');
  //       } else {
  //         toast.error('Failed to upload configuration');
  //       }
  //     } else {
  //       toast.warning('Please select a file or provide manual input');
  //     }
  //   } catch (error) {
  //     toast.error(`Error: ${error.message}`);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (manualInput) {
        // Submit manual input - create a proper config object
        const flowConfig = {
          flowName: formData.flowName,
          refreshInterval: formData.refreshInterval,
          databases: formData.databases,
          flowDefinition: formData.flowDefinition,
          stageMappings: formData.stageMappings
        };
        
        const response = await uploadFlowConfig(flowConfig);
        if (response.status === 'success') {
          toast.success(`Flow ${formData.flowName} created successfully`);
          navigate(`/flows/${formData.flowName}`);
        } else {
          toast.error('Failed to create flow configuration');
        }
      } else if (file) {
        // Submit file upload
        const response = await uploadFlowConfig(file);
        if (response.status === 'success') {
          toast.success(response.message);
          navigate('/');
        } else {
          toast.error('Failed to upload configuration');
        }
      } else {
        toast.warning('Please select a file or provide manual input');
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFormChange = (e, section, subsection = null) => {
    const { name, value } = e.target;
    
    if (subsection) {
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [subsection]: {
            ...formData[section][subsection],
            [name]: value
          }
        }
      });
    } else {
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [name]: value
        }
      });
    }
  };

  const handleFlowDefinitionChange = (e) => {
    setFlowDefinition(e.target.value);
    
    // Try to parse the flow definition
    try {
      const lines = e.target.value.split('\n');
      let overall = '';
      const subStages = { AWS: {}, 'On-PREM': {} };
      let currentSection = null;
      let currentCategory = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        if (trimmedLine.toLowerCase().startsWith('overall flow')) {
          currentSection = 'overall';
        } else if (trimmedLine.toLowerCase().startsWith('sub-stages')) {
          currentSection = 'subStages';
        } else if (currentSection === 'overall' && !overall) {
          overall = trimmedLine;
        } else if (currentSection === 'subStages') {
          if (trimmedLine === 'AWS' || trimmedLine === 'On-PREM') {
            currentCategory = trimmedLine;
          } else if (currentCategory && trimmedLine === '{') {
            // Opening bracket
          } else if (currentCategory && trimmedLine === '}') {
            // Closing bracket
          } else if (currentCategory) {
            // This is a stage definition
            const parts = trimmedLine.split('{');
            if (parts.length === 2) {
              const stageName = parts[0].trim();
              const stageContent = parts[1].replace('}', '').trim();
              subStages[currentCategory][stageName] = stageContent;
            }
          }
        }
      }
      
      setFormData({
        ...formData,
        flowDefinition: {
          overall,
          subStages
        }
      });
      
    } catch (error) {
      console.error('Error parsing flow definition:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Flow Configuration</h1>
      
      <div className="mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${!manualInput ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setManualInput(false)}
          >
            Upload Configuration File
          </button>
          <button
            className={`px-4 py-2 rounded ${manualInput ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setManualInput(true)}
          >
            Manual Configuration
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {!manualInput ? (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Upload JSON Configuration File
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="border rounded p-2 w-full"
              />
              <p className="mt-2 text-sm text-gray-500">
                Upload a JSON file containing the flow configuration.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Flow Name
                </label>
                <input
                  type="text"
                  value={formData.flowName}
                  onChange={(e) => setFormData({...formData, flowName: e.target.value})}
                  className="border rounded p-2 w-full"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Refresh Interval (seconds)
                </label>
                <input
                  type="number"
                  value={formData.refreshInterval}
                  onChange={(e) => setFormData({...formData, refreshInterval: parseInt(e.target.value)})}
                  className="border rounded p-2 w-full"
                  required
                />
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Database Connections</h2>
                
                <div className="bg-blue-50 p-4 rounded mb-4">
                  <h3 className="font-semibold mb-2">AWS RDS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm">Host</label>
                      <input
                        type="text"
                        name="host"
                        value={formData.databases.aws.host}
                        onChange={(e) => handleFormChange(e, 'databases', 'aws')}
                        className="border rounded p-2 w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm">User</label>
                      <input
                        type="text"
                        name="user"
                        value={formData.databases.aws.user}
                        onChange={(e) => handleFormChange(e, 'databases', 'aws')}
                        className="border rounded p-2 w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.databases.aws.password}
                        onChange={(e) => handleFormChange(e, 'databases', 'aws')}
                        className="border rounded p-2 w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm">Database</label>
                      <input
                        type="text"
                        name="database"
                        value={formData.databases.aws.database}
                        onChange={(e) => handleFormChange(e, 'databases', 'aws')}
                        className="border rounded p-2 w-full"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">Oracle</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm">Host</label>
                      <input
                        type="text"
                        name="host"
                        value={formData.databases.oracle.host}
                        onChange={(e) => handleFormChange(e, 'databases', 'oracle')}
                        className="border rounded p-2 w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm">User</label>
                      <input
                        type="text"
                        name="user"
                        value={formData.databases.oracle.user}
                        onChange={(e) => handleFormChange(e, 'databases', 'oracle')}
                        className="border rounded p-2 w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.databases.oracle.password}
                        onChange={(e) => handleFormChange(e, 'databases', 'oracle')}
                        className="border rounded p-2 w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm">Service</label>
                      <input
                        type="text"
                        name="service"
                        value={formData.databases.oracle.service}
                        onChange={(e) => handleFormChange(e, 'databases', 'oracle')}
                        className="border rounded p-2 w-full"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Flow Definition</h2>
                <label className="block text-gray-700 mb-2">
                  Enter flow definition in the specified format
                </label>
                <textarea
                  value={flowDefinition}
                  onChange={handleFlowDefinitionChange}
                  className="border rounded p-2 w-full h-64 font-mono"
                  placeholder="Overall flow

AWS{Calculator_Runs->Cashflow_Generator->Translator_Runs->Intercompany_Runs} ->On-PREM{BPF->FINAL_STAGE}

Sub-stages

AWS
{
Calculator_Runs {
Stage_1_1 -> Stage1_2->Stage1_3}
...
}"
                  required
                />
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Stage Mappings</h2>
                <p className="text-sm text-gray-600 mb-4">
                  For each stage, provide the corresponding database identifier.
                </p>
                
                {/* This would be a dynamic form for stage mappings */}
                <div className="bg-blue-50 p-4 rounded mb-4">
                  <h3 className="font-semibold mb-2">AWS Stage Mappings</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Map stage names to DAG IDs in the format: Stage_1_1: dag_id_1
                  </p>
                  <textarea
                    className="border rounded p-2 w-full h-32 font-mono"
                    placeholder="Stage_1_1: calculator_stage_1_dag
Stage1_2: calculator_stage_2_dag
..."
                  />
                </div>
                
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">On-Prem Stage Mappings</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Map stage names to BPF_ID and PROCESS_ID in the format: Stage5_1: 20010, 10
                  </p>
                  <textarea
                    className="border rounded p-2 w-full h-32 font-mono"
                    placeholder="Stage5_1: 20010, 10
Stage5_2: 20007, 10
..."
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Flow Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlowEditor;
