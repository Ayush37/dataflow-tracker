from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, List, Optional, Union, Set
import asyncio
import json
import logging
from datetime import datetime, timedelta
import os

from database.aws_connector import AWSConnector
from database.oracle_connector import OracleConnector
from models.flow_parser import FlowParser
from services.status_service import StatusService
from services.flow_service import FlowService
from services.config_service import ConfigService
from config import Settings, get_settings

app = FastAPI(title="DERIV Flow Tracker")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directory for configs if it doesn't exist
os.makedirs("configs", exist_ok=True)

# Models
class FlowConfig(BaseModel):
    flowName: str
    refreshInterval: int
    databases: Dict[str, Dict[str, str]]
    flowDefinition: Dict[str, Union[str, Dict[str, Dict[str, str]]]]
    stageMappings: Dict[str, Dict[str, Union[str, Dict[str, int]]]]

class StatusUpdate(BaseModel):
    timestamp: datetime
    flowName: str
    stages: Dict[str, Dict]

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, flow_name: str):
        await websocket.accept()
        if flow_name not in self.active_connections:
            self.active_connections[flow_name] = []
        self.active_connections[flow_name].append(websocket)

    def disconnect(self, websocket: WebSocket, flow_name: str):
        if flow_name in self.active_connections:
            self.active_connections[flow_name].remove(websocket)
            if not self.active_connections[flow_name]:
                del self.active_connections[flow_name]

    async def broadcast(self, message: str, flow_name: str):
        if flow_name in self.active_connections:
            for connection in self.active_connections[flow_name]:
                await connection.send_text(message)

manager = ConnectionManager()

# Services
@app.on_event("startup")
async def startup_event():
    app.state.config_service = ConfigService("configs")
    app.state.flow_service = FlowService()
    app.state.status_service = StatusService()
    
    # Load available flow configurations
    flow_configs = app.state.config_service.list_configs()
    for config_name in flow_configs:
        config = app.state.config_service.load_config(config_name)
        if config:
            try:
                # Parse flow definition
                parser = FlowParser(config["flowDefinition"]["overall"], config["flowDefinition"]["subStages"])
                parsed_flow = parser.parse()
                
                # Add to flow service
                app.state.flow_service.add_flow(
                    config["flowName"],
                    parsed_flow,
                    config["stageMappings"]["aws"],
                    config["stageMappings"]["onPrem"],
                    config["refreshInterval"]
                )
                
                # Start background task for status updates
                background_tasks = BackgroundTasks()
                background_tasks.add_task(status_updater, config["flowName"])
                
                logging.info(f"Loaded flow configuration: {config['flowName']}")
            except Exception as e:
                logging.error(f"Error loading flow configuration {config_name}: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    # Close all database connections
    await app.state.status_service.close_all_connections()

async def status_updater(flow_name: str):
    flow = app.state.flow_service.get_flow(flow_name)
    if not flow:
        logging.error(f"Flow {flow_name} not found")
        return
    
    refresh_interval = flow.get("refresh_interval", 120)
    aws_mappings = flow.get("aws_mappings", {})
    onprem_mappings = flow.get("onprem_mappings", {})
    
    while True:
        try:
            # Get database connections for this flow
            config = app.state.config_service.load_config(f"{flow_name.lower()}.json")
            if not config:
                logging.error(f"Config for flow {flow_name} not found")
                await asyncio.sleep(refresh_interval)
                continue
                
            aws_connector = await app.state.status_service.get_aws_connector(
                config["databases"]["aws"]["host"],
                config["databases"]["aws"]["user"],
                config["databases"]["aws"]["password"],
                config["databases"]["aws"]["database"]
            )
            
            oracle_connector = await app.state.status_service.get_oracle_connector(
                config["databases"]["oracle"]["host"],
                config["databases"]["oracle"]["user"],
                config["databases"]["oracle"]["password"],
                config["databases"]["oracle"]["service"]
            )
            
            # Get status updates
            status = await app.state.status_service.get_flow_status(
                aws_connector, oracle_connector, aws_mappings, onprem_mappings
            )
            
            # Broadcast status update
            update = StatusUpdate(
                timestamp=datetime.now(),
                flowName=flow_name,
                stages=status
            )
            await manager.broadcast(json.dumps(update.dict(), default=str), flow_name)
            
        except Exception as e:
            logging.error(f"Error in status updater for {flow_name}: {e}")
            
        await asyncio.sleep(refresh_interval)

# Endpoints
@app.post("/api/configs/")
async def upload_config(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        config = json.loads(contents)
        
        # Validate config
        if "flowName" not in config:
            raise ValueError("Missing flowName in config")
        
        # Save config
        filename = f"{config['flowName'].lower()}.json"
        await app.state.config_service.save_config(filename, config)
        
        # Parse flow definition
        parser = FlowParser(config["flowDefinition"]["overall"], config["flowDefinition"]["subStages"])
        parsed_flow = parser.parse()
        
        # Add to flow service
        app.state.flow_service.add_flow(
            config["flowName"],
            parsed_flow,
            config["stageMappings"]["aws"],
            config["stageMappings"]["onPrem"],
            config["refreshInterval"]
        )
        
        # Start background task for status updates
        background_tasks = BackgroundTasks()
        background_tasks.add_task(status_updater, config["flowName"])
        
        return {"status": "success", "message": f"Flow {config['flowName']} created"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/configs/")
async def list_configs():
    configs = app.state.config_service.list_configs()
    return {"configs": configs}

@app.get("/api/configs/{name}")
async def get_config(name: str):
    config = app.state.config_service.load_config(name)
    if not config:
        raise HTTPException(status_code=404, detail=f"Config {name} not found")
    return config

@app.get("/api/flows/")
async def list_flows():
    return app.state.flow_service.list_flows()

@app.get("/api/flows/{name}")
async def get_flow(name: str):
    flow = app.state.flow_service.get_flow(name)
    if not flow:
        raise HTTPException(status_code=404, detail=f"Flow {name} not found")
    return flow

@app.get("/api/status/{flow_name}")
async def get_status(flow_name: str):
    flow = app.state.flow_service.get_flow(flow_name)
    if not flow:
        raise HTTPException(status_code=404, detail=f"Flow {flow_name} not found")
    
    # Get database connections for this flow
    config = app.state.config_service.load_config(f"{flow_name.lower()}.json")
    if not config:
        raise HTTPException(status_code=404, detail=f"Config for flow {flow_name} not found")
        
    aws_connector = await app.state.status_service.get_aws_connector(
        config["databases"]["aws"]["host"],
        config["databases"]["aws"]["user"],
        config["databases"]["aws"]["password"],
        config["databases"]["aws"]["database"]
    )
    
    oracle_connector = await app.state.status_service.get_oracle_connector(
        config["databases"]["oracle"]["host"],
        config["databases"]["oracle"]["user"],
        config["databases"]["oracle"]["password"],
        config["databases"]["oracle"]["service"]
    )
    
    aws_mappings = flow.get("aws_mappings", {})
    onprem_mappings = flow.get("onprem_mappings", {})
    
    status = await app.state.status_service.get_flow_status(
        aws_connector, oracle_connector, aws_mappings, onprem_mappings
    )
    
    return {
        "flow_name": flow_name,
        "timestamp": datetime.now(),
        "status": status
    }

@app.websocket("/ws/{flow_name}")
async def websocket_endpoint(websocket: WebSocket, flow_name: str):
    await manager.connect(websocket, flow_name)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle any client messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, flow_name)

# Mount the static files
app.mount("/", StaticFiles(directory="frontend/build", html=True), name="frontend")
