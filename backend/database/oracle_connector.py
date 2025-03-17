# database/oracle_connector.py
import oracledb
import logging
from typing import Dict, List, Tuple, Optional

class OracleConnector:
    def __init__(self, host: str, user: str, password: str, service: str):
        self.host = host
        self.user = user
        self.password = password
        self.service = service
        self.pool = None
        
    async def connect(self):
        if not self.pool:
            try:
                self.pool = await oracledb.create_pool_async(
                    user=self.user,
                    password=self.password,
                    dsn=f"{self.host}/{self.service}",
                    min=1,
                    max=5,
                    increment=1
                )
                logging.info("Connected to Oracle database")
            except Exception as e:
                logging.error(f"Error connecting to Oracle: {e}")
                raise
    
    async def close(self):
        if self.pool:
            await self.pool.close()
            logging.info("Closed connection to Oracle database")
    
    async def get_stage_status(self, stage_mappings: Dict[str, Dict[str, int]]) -> Dict[str, Dict]:
        """
        Get status for on-prem stages
        
        Args:
            stage_mappings: Dict mapping stage names to {bpf_id, process_id} Dict
            
        Returns:
            Dict mapping stage names to status information
        """
        if not self.pool:
            await self.connect()
            
        result = {}
        
        try:
            async with self.pool.acquire() as conn:
                cursor = conn.cursor()
                
                for stage_name, mapping in stage_mappings.items():
                    bpf_id = mapping.get('bpf_id')
                    process_id = mapping.get('process_id')
                    
                    if not bpf_id or not process_id:
                        result[stage_name] = {
                            'status': 'Unknown',
                            'start_date': None,
                            'end_date': None,
                            'error': 'Missing bpf_id or process_id'
                        }
                        continue
                    
                    query = """
                    SELECT status, start_date, end_date
                    FROM on_prem_schema1.stage_status
                    WHERE bpf_id = :bpf_id AND process_id = :process_id
                    """
                    
                    await cursor.execute(query, bpf_id=bpf_id, process_id=process_id)
                    row = await cursor.fetchone()
                    
                    if row:
                        status_text = row[0]  # Status is a string: Not_started, Running, Failed
                        
                        # Map Oracle status to our standardized status
                        mapped_status = {
                            'Not_started': 'pending',
                            'Running': 'running',
                            'Failed': 'failed',
                            'Completed': 'completed'
                        }.get(status_text, status_text.lower())
                        
                        result[stage_name] = {
                            'status': mapped_status,
                            'original_status': status_text,
                            'start_date': row[1],
                            'end_date': row[2]
                        }
                    else:
                        result[stage_name] = {
                            'status': 'not_found',
                            'start_date': None,
                            'end_date': None
                        }
                
                await cursor.close()
                
        except Exception as e:
            logging.error(f"Error fetching Oracle stage status: {e}")
            # Return error status for all stages
            for stage_name in stage_mappings:
                result[stage_name] = {
                    'status': 'error',
                    'start_date': None,
                    'end_date': None,
                    'error': str(e)
                }
                
        return result
