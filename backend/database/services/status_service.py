# services/status_service.py
import logging
from typing import Dict, List, Optional, Any
import time
from datetime import datetime

from database.aws_connector import AWSConnector
from database.oracle_connector import OracleConnector

class StatusService:
    """Service for retrieving status information from various data sources"""
    
    def __init__(self):
        self.aws_connectors = {}  # Cache of AWS connectors
        self.oracle_connectors = {}  # Cache of Oracle connectors
    
    async def get_aws_connector(self, host: str, user: str, password: str, database: str) -> AWSConnector:
        """Get or create an AWS connector for the given connection parameters"""
        connector_key = f"{host}:{database}:{user}"
        
        if connector_key not in self.aws_connectors:
            connector = AWSConnector(host, user, password, database)
            await connector.connect()
            self.aws_connectors[connector_key] = connector
            
        return self.aws_connectors[connector_key]
    
    async def get_oracle_connector(self, host: str, user: str, password: str, service: str) -> OracleConnector:
        """Get or create an Oracle connector for the given connection parameters"""
        connector_key = f"{host}:{service}:{user}"
        
        if connector_key not in self.oracle_connectors:
            connector = OracleConnector(host, user, password, service)
            await connector.connect()
            self.oracle_connectors[connector_key] = connector
            
        return self.oracle_connectors[connector_key]
    
    async def close_all_connections(self):
        """Close all active database connections"""
        for connector in self.aws_connectors.values():
            await connector.close()
        
        for connector in self.oracle_connectors.values():
            await connector.close()
            
        self.aws_connectors = {}
        self.oracle_connectors = {}
    
    async def get_flow_status(
        self, 
        aws_connector: AWSConnector, 
        oracle_connector: OracleConnector,
        aws_mappings: Dict[str, str], 
        onprem_mappings: Dict[str, Dict[str, int]]
    ) -> Dict[str, Any]:
        """Get status for all stages in a flow"""
        result = {}
        
        # Get AWS status
        try:
            dag_ids = list(aws_mappings.values())
            aws_status = await aws_connector.get_dag_status(dag_ids)
            
            # Map DAG status to stage status
            for stage_name, dag_id in aws_mappings.items():
                if dag_id in aws_status:
                    dag_state = aws_status[dag_id].get('state', 'unknown')
                    
                    # Map Airflow state to our status
                    status = {
                        'success': 'completed',
                        'running': 'running',
                        'failed': 'failed',
                        'queued': 'pending',
                        'scheduled': 'pending'
                    }.get(dag_state.lower(), dag_state.lower())
                    
                    result[stage_name] = {
                        'status': status,
                        'start_time': aws_status[dag_id].get('start_date'),
                        'end_time': aws_status[dag_id].get('end_date'),
                        'details': aws_status[dag_id]
                    }
                else:
                    result[stage_name] = {
                        'status': 'unknown',
                        'start_time': None,
                        'end_time': None,
                        'details': {}
                    }
        except Exception as e:
            logging.error(f"Error fetching AWS status: {e}")
            # Set all AWS stages to error status
            for stage_name in aws_mappings:
                result[stage_name] = {
                    'status': 'error',
                    'start_time': None,
                    'end_time': None,
                    'details': {'error': str(e)}
                }
        
        # Get Oracle status
        try:
            oracle_status = await oracle_connector.get_stage_status(onprem_mappings)
            
            # Oracle status is already mapped to stage names
            for stage_name, status_info in oracle_status.items():
                # Map Oracle status to our status format
                oracle_status_value = status_info.get('status', '').lower()
                status = {
                    'not_started': 'pending',
                    'running': 'running',
                    'failed': 'failed',
                    'completed': 'completed'
                }.get(oracle_status_value, oracle_status_value)
                
                result[stage_name] = {
                    'status': status,
                    'start_time': status_info.get('start_date'),
                    'end_time': status_info.get('end_date'),
                    'details': status_info
                }
        except Exception as e:
            logging.error(f"Error fetching Oracle status: {e}")
            # Set all Oracle stages to error status
            for stage_name in onprem_mappings:
                result[stage_name] = {
                    'status': 'error',
                    'start_time': None,
                    'end_time': None,
                    'details': {'error': str(e)}
                }
        
        return result
