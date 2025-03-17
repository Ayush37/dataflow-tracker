from typing import Dict, List, Any, Optional
import os
import json
import logging

class FlowService:
    """Service for managing flow definitions and their mappings"""
    
    def __init__(self):
        self.flows = {}  # Dictionary of flow definitions
    
    def add_flow(
        self, 
        name: str, 
        flow_definition: Dict[str, Any], 
        aws_mappings: Dict[str, str],
        onprem_mappings: Dict[str, Dict[str, int]],
        refresh_interval: int = 120
    ) -> None:
        """Add or update a flow definition"""
        self.flows[name] = {
            "name": name,
            "definition": flow_definition,
            "aws_mappings": aws_mappings,
            "onprem_mappings": onprem_mappings,
            "refresh_interval": refresh_interval
        }
        logging.info(f"Added flow: {name}")
    
    def get_flow(self, name: str) -> Optional[Dict[str, Any]]:
        """Get a flow definition by name"""
        return self.flows.get(name)
    
    def list_flows(self) -> List[Dict[str, Any]]:
        """List all available flows"""
        return [
            {
                "name": name,
                "nodeCount": len(flow["definition"]["nodes"]),
                "edgeCount": len(flow["definition"]["edges"]),
                "categoryCount": len(flow["definition"]["categories"])
            }
            for name, flow in self.flows.items()
        ]
    
    def remove_flow(self, name: str) -> bool:
        """Remove a flow definition"""
        if name in self.flows:
            del self.flows[name]
            logging.info(f"Removed flow: {name}")
            return True
        return False
    
    def update_flow_status(self, name: str, stage_name: str, status: str) -> bool:
        """Update the status of a stage in a flow"""
        if name not in self.flows:
            return False
            
        flow = self.flows[name]
        nodes = flow["definition"]["nodes"]
        
        # Find the stage node
        for node in nodes:
            if node["type"] == "stage" and node["data"]["label"] == stage_name:
                node["data"]["status"] = status
                logging.info(f"Updated status of {stage_name} in {name} to {status}")
                return True
                
        return False

# services/config_service.py
import os
import json
import logging
from typing import Dict, List, Any, Optional

class ConfigService:
    """Service for managing configuration files"""
    
    def __init__(self, config_dir: str = "configs"):
        self.config_dir = config_dir
        os.makedirs(config_dir, exist_ok=True)
    
    async def save_config(self, filename: str, config: Dict[str, Any]) -> bool:
        """Save a configuration to file"""
        try:
            file_path = os.path.join(self.config_dir, filename)
            with open(file_path, 'w') as f:
                json.dump(config, f, indent=2)
            logging.info(f"Saved configuration to {file_path}")
            return True
        except Exception as e:
            logging.error(f"Error saving configuration: {e}")
            return False
    
    def load_config(self, filename: str) -> Optional[Dict[str, Any]]:
        """Load a configuration from file"""
        try:
            file_path = os.path.join(self.config_dir, filename)
            if not os.path.exists(file_path):
                return None
                
            with open(file_path, 'r') as f:
                config = json.load(f)
            return config
        except Exception as e:
            logging.error(f"Error loading configuration: {e}")
            return None
    
    def list_configs(self) -> List[str]:
        """List all available configuration files"""
        try:
            return [
                file for file in os.listdir(self.config_dir) 
                if file.endswith('.json')
            ]
        except Exception as e:
            logging.error(f"Error listing configurations: {e}")
            return []
    
    def delete_config(self, filename: str) -> bool:
        """Delete a configuration file"""
        try:
            file_path = os.path.join(self.config_dir, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                logging.info(f"Deleted configuration: {file_path}")
                return True
            return False
        except Exception as e:
            logging.error(f"Error deleting configuration: {e}")
            return False
