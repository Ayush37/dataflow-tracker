# database/aws_connector.py
import aiomysql
import logging
from typing import Dict, List, Optional

class AWSConnector:
    def __init__(self, host: str, user: str, password: str, database: str):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.pool = None
        
    async def connect(self):
        if not self.pool:
            try:
                self.pool = await aiomysql.create_pool(
                    host=self.host,
                    user=self.user,
                    password=self.password,
                    db=self.database,
                    autocommit=True
                )
                logging.info("Connected to AWS RDS database")
            except Exception as e:
                logging.error(f"Error connecting to AWS RDS: {e}")
                raise
    
    async def close(self):
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
            logging.info("Closed connection to AWS RDS database")
    
    async def get_dag_status(self, dag_ids: List[str]) -> Dict[str, Dict]:
        """Get status information for specified DAGs"""
        if not self.pool:
            await self.connect()
            
        result = {}
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    # Get the latest run for each DAG
                    placeholders = ', '.join(['%s'] * len(dag_ids))
                    query = f"""
                    SELECT r.dag_id, r.state, r.execution_date, r.start_date, r.end_date
                    FROM schema1.dag_run r
                    INNER JOIN (
                        SELECT dag_id, MAX(execution_date) as max_date
                        FROM schema1.dag_run
                        WHERE dag_id IN ({placeholders})
                        GROUP BY dag_id
                    ) latest ON r.dag_id = latest.dag_id AND r.execution_date = latest.max_date
                    """
                    await cursor.execute(query, dag_ids)
                    rows = await cursor.fetchall()
                    
                    for row in rows:
                        result[row['dag_id']] = {
                            'state': row['state'],
                            'execution_date': row['execution_date'],
                            'start_date': row['start_date'],
                            'end_date': row['end_date']
                        }
                        
                    # For any DAGs not found, add a default entry
                    for dag_id in dag_ids:
                        if dag_id not in result:
                            result[dag_id] = {
                                'state': 'unknown',
                                'execution_date': None,
                                'start_date': None,
                                'end_date': None
                            }
        except Exception as e:
            logging.error(f"Error fetching DAG status: {e}")
            # Return unknown status for all DAGs
            for dag_id in dag_ids:
                result[dag_id] = {
                    'state': 'error',
                    'execution_date': None,
                    'start_date': None,
                    'end_date': None,
                    'error': str(e)
                }
                
        return result
