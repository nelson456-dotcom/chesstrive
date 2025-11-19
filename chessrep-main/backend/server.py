from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from contextlib import asynccontextmanager # Import for lifespan
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging early
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection details
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
client: AsyncIOMotorClient = None # Initialize client as None
db = None # Initialize db as None

# Lifespan manager for startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db # Declare client and db as global to modify them
    # Startup: Connect to MongoDB
    logger.info("Application startup: Connecting to MongoDB...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    logger.info(f"Successfully connected to MongoDB database: {db_name}")
    try:
        yield # Application is ready to serve requests
    finally:
        # Shutdown: Close MongoDB client
        if client:
            logger.info("Application shutdown: Closing MongoDB client.")
            client.close()
            logger.info("MongoDB client closed.")

# Create the main app with the lifespan manager
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World from API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input_data: StatusCheckCreate): # Renamed 'input' to 'input_data' to avoid shadowing built-in
    status_dict = input_data.model_dump() # Use model_dump() for Pydantic v2+
    status_obj = StatusCheck(**status_dict)
    # Ensure db is available (it will be after lifespan startup)
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    _ = await db.status_checks.insert_one(status_obj.model_dump()) # Use model_dump()
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Ensure db is available
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    status_checks_cursor = db.status_checks.find()
    status_checks_list = await status_checks_cursor.to_list(length=1000) # Specify length for to_list
    return [StatusCheck(**status_check) for status_check in status_checks_list]

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[origin for origin in (os.getenv("ALLOWED_ORIGINS") or "http://localhost:3000").split(",")],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "x-auth-token"],
)

# A simple root endpoint for the main app (optional)
@app.get("/")
async def main_app_root():
    return {"message": "Welcome to the ChessRep Backend!"}

# If you intend to run this with `python server.py` using uvicorn programmatically:
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Uvicorn server programmatically...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

