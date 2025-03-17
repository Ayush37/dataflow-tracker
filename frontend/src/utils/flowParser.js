// utils/flowParser.js
/**
 * Parses a flow definition string into a structured format
 * @param {string} flowDefinition - The flow definition in text format
 * @returns {Object} Parsed flow definition
 */
export const parseFlowDefinition = (flowDefinition) => {
  const result = {
    overall: '',
    subStages: {
      'AWS': {},
      'On-PREM': {}
    }
  };
  
  try {
    const lines = flowDefinition.split('\n');
    let section = null;
    let currentCategory = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      if (trimmedLine.toLowerCase().startsWith('overall flow')) {
        section = 'overall';
      } else if (trimmedLine.toLowerCase().startsWith('sub-stages')) {
        section = 'subStages';
      } else if (section === 'overall' && !result.overall) {
        result.overall = trimmedLine;
      } else if (section === 'subStages') {
        if (trimmedLine === 'AWS' || trimmedLine === 'On-PREM') {
          currentCategory = trimmedLine;
        } else if (currentCategory && trimmedLine === '{') {
          // Opening bracket, just continue
        } else if (currentCategory && trimmedLine === '}') {
          // Closing bracket, just continue
        } else if (currentCategory) {
          // Check if this is a stage definition
          const stageMatch = trimmedLine.match(/^(.+)\s*\{(.+)\}$/);
          if (stageMatch) {
            const stageName = stageMatch[1].trim();
            const stageContent = stageMatch[2].trim();
            result.subStages[currentCategory][stageName] = stageContent;
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing flow definition:', error);
    throw new Error('Invalid flow definition format');
  }
};

/**
 * Parses stage mappings from text format
 * @param {string} awsMappingsText - AWS mappings in text format
 * @param {string} onPremMappingsText - On-Prem mappings in text format
 * @returns {Object} Parsed stage mappings
 */
export const parseStageMappings = (awsMappingsText, onPremMappingsText) => {
  const result = {
    aws: {},
    onPrem: {}
  };
  
  try {
    // Parse AWS mappings (Stage_name: dag_id)
    if (awsMappingsText) {
      const lines = awsMappingsText.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        const [stageName, dagId] = trimmedLine.split(':').map(part => part.trim());
        if (stageName && dagId) {
          result.aws[stageName] = dagId;
        }
      }
    }
    
    // Parse On-Prem mappings (Stage_name: bpf_id, process_id)
    if (onPremMappingsText) {
      const lines = onPremMappingsText.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        const [stageName, idsStr] = trimmedLine.split(':').map(part => part.trim());
        if (stageName && idsStr) {
          const [bpf_id, process_id] = idsStr.split(',').map(id => parseInt(id.trim(), 10));
          if (!isNaN(bpf_id) && !isNaN(process_id)) {
            result.onPrem[stageName] = { bpf_id, process_id };
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing stage mappings:', error);
    throw new Error('Invalid stage mappings format');
  }
};
