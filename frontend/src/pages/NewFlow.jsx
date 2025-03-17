// pages/NewFlow.jsx
import React from 'react';
import FlowEditor from '../components/FlowEditor';

const NewFlow = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create New Batch Process</h1>
      <FlowEditor />
    </div>
  );
};

export default NewFlow;
