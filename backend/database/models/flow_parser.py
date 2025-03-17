# models/flow_parser.py
import re
from typing import Dict, List, Set, Tuple, Any, Union

class FlowParser:
    """Parser for the flow definition format"""
    
    def __init__(self, overall_flow: str, sub_stages: Dict[str, Dict[str, str]]):
        self.overall_flow = overall_flow
        self.sub_stages = sub_stages
        self.nodes = []  # List of node objects
        self.edges = []  # List of edge objects
        self.categories = {}  # Mapping of category name to list of node IDs
        
    def parse(self) -> Dict:
        """Parse the flow definition and return a structured representation for visualization"""
        # Parse overall flow to get main categories and their connections
        self._parse_overall_flow()
        
        # Parse sub-stages to get detailed node structure
        self._parse_sub_stages()
        
        # Build the final flow structure
        return {
            "nodes": self.nodes,
            "edges": self.edges,
            "categories": self.categories
        }
    
    def _parse_overall_flow(self):
        """Parse the overall flow to extract main categories and dependencies"""
        # Extract category blocks using regex
        category_pattern = r'([A-Za-z0-9_-]+)\{([^{}]+)\}'
        category_matches = re.findall(category_pattern, self.overall_flow)
        
        # Track position for layout
        x_position = 100
        y_position = 100
        last_category_id = None
        
        for category_name, content in category_matches:
            # Create category node
            category_id = f"category-{category_name}"
            self.nodes.append({
                "id": category_id,
                "type": "category",
                "data": {
                    "label": category_name,
                    "stages": []
                },
                "position": {"x": x_position, "y": y_position},
                "style": {
                    "width": 500,
                    "height": 400
                }
            })
            
            # Initialize category in categories mapping
            self.categories[category_name] = []
            
            # Extract stages within this category
            stages = [s.strip() for s in content.split('->')]
            
            # Track position within category
            stage_x = 50
            stage_y = 80
            last_stage_id = None
            
            for stage in stages:
                stage_id = f"stage-{category_name}-{stage}"
                
                # Add stage to nodes
                self.nodes.append({
                    "id": stage_id,
                    "type": "stage",
                    "data": {
                        "label": stage,
                        "category": category_name,
                        "status": "pending",
                        "subStages": []
                    },
                    "position": {"x": stage_x, "y": stage_y},
                    "parentNode": category_id,
                    "extent": "parent"
                })
                
                # Add stage to its category
                self.categories[category_name].append(stage_id)
                
                # Connect to previous stage if exists
                if last_stage_id:
                    self.edges.append({
                        "id": f"edge-{last_stage_id}-{stage_id}",
                        "source": last_stage_id,
                        "target": stage_id,
                        "animated": True,
                        "type": "smoothstep"
                    })
                
                # Update for next stage
                last_stage_id = stage_id
                stage_x += 150
            
            # Connect categories if needed
            if last_category_id:
                # Find the last stage of previous category
                prev_category_stages = self.categories[last_category_id.replace("category-", "")]
                if prev_category_stages:
                    self.edges.append({
                        "id": f"edge-{prev_category_stages[-1]}-{self.categories[category_name][0]}",
                        "source": prev_category_stages[-1],
                        "target": self.categories[category_name][0],
                        "animated": True,
                        "type": "smoothstep"
                    })
            
            # Update for next category
            last_category_id = category_id
            x_position += 600
    
    def _parse_sub_stages(self):
        """Parse sub-stages to get detailed node structure"""
        for category_name, stages in self.sub_stages.items():
            for stage_name, sub_stages_str in stages.items():
                stage_id = f"stage-{category_name}-{stage_name}"
                
                # Find the stage node
                stage_node = next((node for node in self.nodes if node["id"] == stage_id), None)
                if not stage_node:
                    continue
                
                # Parse sub-stages
                if '->' in sub_stages_str:
                    # Sequential sub-stages
                    sub_stages = [s.strip() for s in sub_stages_str.split('->')]
                    last_sub_stage = None
                    
                    for sub_stage in sub_stages:
                        sub_stage_id = f"substage-{category_name}-{stage_name}-{sub_stage}"
                        stage_node["data"]["subStages"].append({
                            "id": sub_stage_id,
                            "name": sub_stage,
                            "type": "sequential"
                        })
                        
                        if last_sub_stage:
                            stage_node["data"]["subStages"][-2]["next"] = sub_stage_id
                        
                        last_sub_stage = sub_stage_id
                elif ',' in sub_stages_str:
                    # Parallel sub-stages
                    sub_stages = [s.strip() for s in sub_stages_str.split(',')]
                    
                    for sub_stage in sub_stages:
                        sub_stage_id = f"substage-{category_name}-{stage_name}-{sub_stage}"
                        stage_node["data"]["subStages"].append({
                            "id": sub_stage_id,
                            "name": sub_stage,
                            "type": "parallel"
                        })
                else:
                    # Single sub-stage
                    sub_stage = sub_stages_str.strip()
                    sub_stage_id = f"substage-{category_name}-{stage_name}-{sub_stage}"
                    stage_node["data"]["subStages"].append({
                        "id": sub_stage_id,
                        "name": sub_stage,
                        "type": "single"
                    })
