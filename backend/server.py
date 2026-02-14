from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, validator
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import re
from enum import Enum
import shutil
import paypalrestsdk

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'logimatch_secret_key_change_in_production')
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# PayPal Configuration
paypalrestsdk.configure({
    "mode": os.environ.get("PAYPAL_MODE", "sandbox"),
    "client_id": os.environ.get("PAYPAL_CLIENT_ID", ""),
    "client_secret": os.environ.get("PAYPAL_SECRET", "")
})

app = FastAPI(title="LogiMatch API", description="Plateforme de mise en relation France-Tunisie pour envoi de colis", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== ENUMS ====================
class UserRole(str, Enum):
    SHIPPER = "SHIPPER"
    CARRIER_INDIVIDUAL = "CARRIER_INDIVIDUAL"
    CARRIER_PRO = "CARRIER_PRO"
    SHIPPER_CARRIER = "SHIPPER_CARRIER"  # Expéditeur + Transporteur
    ADMIN = "ADMIN"

class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    PENDING = "PENDING"

class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class ShippingMode(str, Enum):
    TERRESTRIAL = "TERRESTRIAL"
    AIR = "AIR"

class RequestStatus(str, Enum):
    OPEN = "OPEN"
    IN_NEGOTIATION = "IN_NEGOTIATION"
    ACCEPTED = "ACCEPTED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class OfferStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    EXPIRED = "EXPIRED"

class ContractStatus(str, Enum):
    PROPOSED = "PROPOSED"
    ACCEPTED = "ACCEPTED"
    PICKED_UP = "PICKED_UP"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class ReportTargetType(str, Enum):
    USER = "USER"
    REQUEST = "REQUEST"
    OFFER = "OFFER"
    MESSAGE = "MESSAGE"

class ReportStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"

# ==================== MODELS ====================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Literal["SHIPPER", "CARRIER_INDIVIDUAL", "CARRIER_PRO", "SHIPPER_CARRIER"]
    first_name: str
    last_name: str
    phone: str
    country: str
    city: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None

class ProVerificationCreate(BaseModel):
    company_name: str
    siret: Optional[str] = None

class RequestCreate(BaseModel):
    origin_country: str
    origin_city: str
    destination_country: str
    destination_city: str
    weight: float
    width: Optional[float] = None
    height: Optional[float] = None
    length: Optional[float] = None
    package_type: str
    mode: ShippingMode
    deadline: datetime
    description: str

class RequestUpdate(BaseModel):
    origin_country: Optional[str] = None
    origin_city: Optional[str] = None
    destination_country: Optional[str] = None
    destination_city: Optional[str] = None
    weight: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    length: Optional[float] = None
    package_type: Optional[str] = None
    mode: Optional[ShippingMode] = None
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    status: Optional[RequestStatus] = None

class OfferCreate(BaseModel):
    origin_country: str
    origin_city: str
    destination_country: str
    destination_city: str
    departure_date: datetime
    arrival_date: datetime
    capacity_kg: float
    mode: ShippingMode
    price_per_kg: float
    conditions: Optional[str] = None

class OfferUpdate(BaseModel):
    origin_country: Optional[str] = None
    origin_city: Optional[str] = None
    destination_country: Optional[str] = None
    destination_city: Optional[str] = None
    departure_date: Optional[datetime] = None
    arrival_date: Optional[datetime] = None
    capacity_kg: Optional[float] = None
    mode: Optional[ShippingMode] = None
    price_per_kg: Optional[float] = None
    conditions: Optional[str] = None
    status: Optional[OfferStatus] = None

class ConversationCreate(BaseModel):
    request_id: Optional[str] = None
    offer_id: Optional[str] = None
    participant_id: str

class MessageCreate(BaseModel):
    text: str

class ContractCreate(BaseModel):
    request_id: str
    offer_id: Optional[str] = None
    carrier_id: str
    proposed_price: float

class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str

class ReportCreate(BaseModel):
    target_type: ReportTargetType
    target_id: str
    reason: str
    details: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

class PhoneVerify(BaseModel):
    code: str

# ==================== COUNTRY & SETTINGS MODELS ====================
class CountryCreate(BaseModel):
    name: str
    code: str
    is_origin: bool = True
    is_destination: bool = True

class CountryUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    is_origin: Optional[bool] = None
    is_destination: Optional[bool] = None

class PlatformSettingsUpdate(BaseModel):
    commission_enabled: Optional[bool] = None
    shipper_commission_rate: Optional[float] = None
    carrier_commission_rate: Optional[float] = None

class PaymentCreate(BaseModel):
    contract_id: str
    return_url: str
    cancel_url: str

class VisitorTrack(BaseModel):
    page: str
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    screen_width: Optional[int] = None
    screen_height: Optional[int] = None
    language: Optional[str] = None

class GoogleAdsSettingsUpdate(BaseModel):
    ads_enabled: Optional[bool] = None
    publisher_id: Optional[str] = None
    header_ad_slot: Optional[str] = None
    sidebar_ad_slot: Optional[str] = None
    footer_ad_slot: Optional[str] = None
    in_content_ad_slot: Optional[str] = None

# ==================== HELPERS ====================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    if user.get("status") == UserStatus.SUSPENDED.value:
        raise HTTPException(status_code=403, detail="Compte suspendu")
    return user

async def require_role(user: dict, roles: List[str]):
    if user.get("role") not in roles:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

def serialize_doc(doc: dict) -> dict:
    if doc and "_id" in doc:
        del doc["_id"]
    return doc

def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": data.role,
        "status": UserStatus.ACTIVE.value,
        "phone_verified": False,
        "first_name": data.first_name,
        "last_name": data.last_name,
        "phone": data.phone,
        "country": data.country,
        "city": data.city,
        "avatar_url": None,
        "bio": None,
        "rating_sum": 0,
        "rating_count": 0,
        "created_at": now_utc()
    }
    await db.users.insert_one(user)
    
    if data.role == "CARRIER_PRO":
        verification = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "company_name": "",
            "documents": [],
            "status": VerificationStatus.PENDING.value,
            "created_at": now_utc()
        }
        await db.pro_verifications.insert_one(verification)
    
    access_token = create_token({"sub": user_id, "role": data.role}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_token({"sub": user_id, "type": "refresh"}, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    
    user_response = serialize_doc(user)
    del user_response["password_hash"]
    
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if user.get("status") == UserStatus.SUSPENDED.value:
        raise HTTPException(status_code=403, detail="Compte suspendu")
    
    access_token = create_token({"sub": user["id"], "role": user["role"]}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_token({"sub": user["id"], "type": "refresh"}, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    
    user_response = serialize_doc(user)
    del user_response["password_hash"]
    
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=user_response)

@api_router.post("/auth/refresh")
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Token de rafraîchissement invalide")
    
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    
    access_token = create_token({"sub": user["id"], "role": user["role"]}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    return {"message": "Déconnexion réussie"}

@api_router.post("/auth/request-password-reset")
async def request_password_reset(data: PasswordResetRequest):
    user = await db.users.find_one({"email": data.email})
    if user:
        reset_token = create_token({"sub": user["id"], "type": "password_reset"}, timedelta(hours=1))
        logger.info(f"Password reset token for {data.email}: {reset_token}")
    return {"message": "Si l'email existe, un lien de réinitialisation a été envoyé"}

@api_router.post("/auth/reset-password")
async def reset_password(data: PasswordReset):
    payload = decode_token(data.token)
    if payload.get("type") != "password_reset":
        raise HTTPException(status_code=400, detail="Token invalide")
    
    await db.users.update_one(
        {"id": payload.get("sub")},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    return {"message": "Mot de passe réinitialisé avec succès"}

@api_router.post("/auth/verify-phone")
async def verify_phone(data: PhoneVerify, user: dict = Depends(get_current_user)):
    if data.code == "123456":
        await db.users.update_one({"id": user["id"]}, {"$set": {"phone_verified": True}})
        return {"message": "Téléphone vérifié"}
    raise HTTPException(status_code=400, detail="Code invalide")

# ==================== USER ROUTES ====================
@api_router.get("/users/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.patch("/users/me")
async def update_me(data: UserUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated

@api_router.get("/users/{user_id}")
async def get_user_public(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "email": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    reviews = await db.reviews.find({"reviewee_id": user_id}, {"_id": 0}).to_list(100)
    user["reviews"] = reviews
    return user

@api_router.post("/users/me/avatar")
async def upload_avatar(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"{user['id']}_avatar.{ext}"
    filepath = UPLOAD_DIR / filename
    
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    avatar_url = f"/uploads/{filename}"
    await db.users.update_one({"id": user["id"]}, {"$set": {"avatar_url": avatar_url}})
    return {"avatar_url": avatar_url}

@api_router.get("/users/{user_id}/reviews")
async def get_user_reviews(user_id: str):
    reviews = await db.reviews.find({"reviewee_id": user_id}, {"_id": 0}).to_list(100)
    return reviews

# ==================== PRO VERIFICATION ====================
@api_router.post("/users/me/verification")
async def create_verification(data: ProVerificationCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "CARRIER_PRO":
        raise HTTPException(status_code=403, detail="Réservé aux transporteurs pro")
    
    existing = await db.pro_verifications.find_one({"user_id": user["id"]})
    if existing:
        await db.pro_verifications.update_one(
            {"user_id": user["id"]},
            {"$set": {"company_name": data.company_name, "siret": data.siret}}
        )
    else:
        verification = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "company_name": data.company_name,
            "siret": data.siret,
            "documents": [],
            "status": VerificationStatus.PENDING.value,
            "created_at": now_utc()
        }
        await db.pro_verifications.insert_one(verification)
    
    return {"message": "Vérification soumise"}

@api_router.post("/users/me/verification/documents")
async def upload_verification_doc(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if user["role"] != "CARRIER_PRO":
        raise HTTPException(status_code=403, detail="Réservé aux transporteurs pro")
    
    ext = file.filename.split(".")[-1] if file.filename else "pdf"
    filename = f"{user['id']}_doc_{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    doc_url = f"/uploads/{filename}"
    await db.pro_verifications.update_one(
        {"user_id": user["id"]},
        {"$push": {"documents": doc_url}}
    )
    return {"document_url": doc_url}

@api_router.get("/users/me/verification")
async def get_my_verification(user: dict = Depends(get_current_user)):
    if user["role"] != "CARRIER_PRO":
        raise HTTPException(status_code=403, detail="Réservé aux transporteurs pro")
    
    verification = await db.pro_verifications.find_one({"user_id": user["id"]}, {"_id": 0})
    return verification

# ==================== REQUESTS ROUTES ====================
@api_router.post("/requests")
async def create_request(data: RequestCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["SHIPPER", "SHIPPER_CARRIER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Seuls les expéditeurs peuvent créer des demandes")
    
    request_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **data.model_dump(),
        "deadline": data.deadline.isoformat(),
        "photos": [],
        "status": RequestStatus.OPEN.value,
        "hidden": False,
        "created_at": now_utc()
    }
    await db.requests.insert_one(request_doc)
    return serialize_doc(request_doc)

@api_router.get("/requests")
async def list_requests(
    origin_country: Optional[str] = None,
    destination_country: Optional[str] = None,
    mode: Optional[ShippingMode] = None,
    min_weight: Optional[float] = None,
    max_weight: Optional[float] = None,
    status: Optional[RequestStatus] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    query = {"hidden": {"$ne": True}}
    if origin_country:
        query["origin_country"] = origin_country
    if destination_country:
        query["destination_country"] = destination_country
    if mode:
        query["mode"] = mode.value
    if min_weight:
        query["weight"] = {"$gte": min_weight}
    if max_weight:
        query.setdefault("weight", {})["$lte"] = max_weight
    if status:
        query["status"] = status.value
    
    skip = (page - 1) * limit
    requests = await db.requests.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.requests.count_documents(query)
    
    for req in requests:
        user = await db.users.find_one({"id": req["user_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1, "rating_sum": 1, "rating_count": 1})
        req["user"] = user
    
    return {"items": requests, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/requests/mine")
async def list_my_requests(user: dict = Depends(get_current_user), page: int = 1, limit: int = 20):
    skip = (page - 1) * limit
    requests = await db.requests.find({"user_id": user["id"]}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.requests.count_documents({"user_id": user["id"]})
    return {"items": requests, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/requests/{request_id}")
async def get_request(request_id: str):
    req = await db.requests.find_one({"id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    user = await db.users.find_one({"id": req["user_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1, "rating_sum": 1, "rating_count": 1, "city": 1, "country": 1})
    req["user"] = user
    return req

@api_router.patch("/requests/{request_id}")
async def update_request(request_id: str, data: RequestUpdate, user: dict = Depends(get_current_user)):
    req = await db.requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    if req["user_id"] != user["id"] and user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "deadline" in update_data:
        update_data["deadline"] = update_data["deadline"].isoformat()
    if "mode" in update_data:
        update_data["mode"] = update_data["mode"].value
    if "status" in update_data:
        update_data["status"] = update_data["status"].value
    
    if update_data:
        await db.requests.update_one({"id": request_id}, {"$set": update_data})
    
    return await db.requests.find_one({"id": request_id}, {"_id": 0})

@api_router.delete("/requests/{request_id}")
async def delete_request(request_id: str, user: dict = Depends(get_current_user)):
    req = await db.requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    if req["user_id"] != user["id"] and user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.requests.delete_one({"id": request_id})
    return {"message": "Demande supprimée"}

@api_router.post("/requests/{request_id}/photos")
async def upload_request_photo(request_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    req = await db.requests.find_one({"id": request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    if req["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"request_{request_id}_{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    photo_url = f"/uploads/{filename}"
    await db.requests.update_one({"id": request_id}, {"$push": {"photos": photo_url}})
    return {"photo_url": photo_url}

# ==================== OFFERS ROUTES ====================
@api_router.post("/offers")
async def create_offer(data: OfferCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["CARRIER_INDIVIDUAL", "CARRIER_PRO", "SHIPPER_CARRIER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Seuls les transporteurs peuvent créer des offres")
    
    offer_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **data.model_dump(),
        "departure_date": data.departure_date.isoformat(),
        "arrival_date": data.arrival_date.isoformat(),
        "status": OfferStatus.ACTIVE.value,
        "hidden": False,
        "created_at": now_utc()
    }
    await db.offers.insert_one(offer_doc)
    return serialize_doc(offer_doc)

@api_router.get("/offers")
async def list_offers(
    origin_country: Optional[str] = None,
    destination_country: Optional[str] = None,
    mode: Optional[ShippingMode] = None,
    min_capacity: Optional[float] = None,
    status: Optional[OfferStatus] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    query = {"hidden": {"$ne": True}, "status": OfferStatus.ACTIVE.value}
    if origin_country:
        query["origin_country"] = origin_country
    if destination_country:
        query["destination_country"] = destination_country
    if mode:
        query["mode"] = mode.value
    if min_capacity:
        query["capacity_kg"] = {"$gte": min_capacity}
    if status:
        query["status"] = status.value
    
    skip = (page - 1) * limit
    offers = await db.offers.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.offers.count_documents(query)
    
    for offer in offers:
        user = await db.users.find_one({"id": offer["user_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1, "rating_sum": 1, "rating_count": 1, "role": 1})
        offer["user"] = user
    
    return {"items": offers, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/offers/mine")
async def list_my_offers(user: dict = Depends(get_current_user), page: int = 1, limit: int = 20):
    skip = (page - 1) * limit
    offers = await db.offers.find({"user_id": user["id"]}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.offers.count_documents({"user_id": user["id"]})
    return {"items": offers, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/offers/{offer_id}")
async def get_offer(offer_id: str):
    offer = await db.offers.find_one({"id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offre non trouvée")
    
    user = await db.users.find_one({"id": offer["user_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1, "rating_sum": 1, "rating_count": 1, "city": 1, "country": 1, "role": 1})
    offer["user"] = user
    return offer

@api_router.patch("/offers/{offer_id}")
async def update_offer(offer_id: str, data: OfferUpdate, user: dict = Depends(get_current_user)):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offre non trouvée")
    if offer["user_id"] != user["id"] and user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "departure_date" in update_data:
        update_data["departure_date"] = update_data["departure_date"].isoformat()
    if "arrival_date" in update_data:
        update_data["arrival_date"] = update_data["arrival_date"].isoformat()
    if "mode" in update_data:
        update_data["mode"] = update_data["mode"].value
    if "status" in update_data:
        update_data["status"] = update_data["status"].value
    
    if update_data:
        await db.offers.update_one({"id": offer_id}, {"$set": update_data})
    
    return await db.offers.find_one({"id": offer_id}, {"_id": 0})

@api_router.delete("/offers/{offer_id}")
async def delete_offer(offer_id: str, user: dict = Depends(get_current_user)):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offre non trouvée")
    if offer["user_id"] != user["id"] and user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.offers.delete_one({"id": offer_id})
    return {"message": "Offre supprimée"}

# ==================== MATCHING ROUTES ====================
@api_router.get("/matching/requests/{request_id}/offers")
async def get_matching_offers(request_id: str, page: int = 1, limit: int = 20):
    req = await db.requests.find_one({"id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    query = {
        "status": OfferStatus.ACTIVE.value,
        "hidden": {"$ne": True},
        "origin_country": req["origin_country"],
        "destination_country": req["destination_country"],
        "mode": req["mode"],
        "capacity_kg": {"$gte": req["weight"]}
    }
    
    skip = (page - 1) * limit
    offers = await db.offers.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.offers.count_documents(query)
    
    for offer in offers:
        user = await db.users.find_one({"id": offer["user_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1, "rating_sum": 1, "rating_count": 1, "role": 1})
        offer["user"] = user
    
    return {"items": offers, "total": total, "page": page, "request": req}

@api_router.get("/matching/offers/{offer_id}/requests")
async def get_matching_requests(offer_id: str, page: int = 1, limit: int = 20):
    offer = await db.offers.find_one({"id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offre non trouvée")
    
    query = {
        "status": RequestStatus.OPEN.value,
        "hidden": {"$ne": True},
        "origin_country": offer["origin_country"],
        "destination_country": offer["destination_country"],
        "mode": offer["mode"],
        "weight": {"$lte": offer["capacity_kg"]}
    }
    
    skip = (page - 1) * limit
    requests = await db.requests.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.requests.count_documents(query)
    
    for req in requests:
        user = await db.users.find_one({"id": req["user_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1, "rating_sum": 1, "rating_count": 1})
        req["user"] = user
    
    return {"items": requests, "total": total, "page": page, "offer": offer}

# ==================== MESSAGING ROUTES ====================
@api_router.post("/conversations")
async def create_conversation(data: ConversationCreate, user: dict = Depends(get_current_user)):
    participants = sorted([user["id"], data.participant_id])
    
    query = {"participants": participants}
    if data.request_id:
        query["request_id"] = data.request_id
    if data.offer_id:
        query["offer_id"] = data.offer_id
    
    existing = await db.conversations.find_one(query, {"_id": 0})
    if existing:
        return existing
    
    conversation = {
        "id": str(uuid.uuid4()),
        "request_id": data.request_id,
        "offer_id": data.offer_id,
        "participants": participants,
        "last_message": None,
        "last_message_at": now_utc(),
        "created_at": now_utc()
    }
    await db.conversations.insert_one(conversation)
    return serialize_doc(conversation)

@api_router.get("/conversations")
async def list_conversations(user: dict = Depends(get_current_user)):
    conversations = await db.conversations.find(
        {"participants": user["id"]},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(100)
    
    for conv in conversations:
        other_id = [p for p in conv["participants"] if p != user["id"]][0]
        other_user = await db.users.find_one({"id": other_id}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1})
        conv["other_user"] = other_user
        
        if conv.get("request_id"):
            req = await db.requests.find_one({"id": conv["request_id"]}, {"_id": 0, "origin_city": 1, "destination_city": 1, "package_type": 1})
            conv["request"] = req
        if conv.get("offer_id"):
            offer = await db.offers.find_one({"id": conv["offer_id"]}, {"_id": 0, "origin_city": 1, "destination_city": 1})
            conv["offer"] = offer
    
    return conversations

@api_router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if user["id"] not in conv["participants"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    other_id = [p for p in conv["participants"] if p != user["id"]][0]
    other_user = await db.users.find_one({"id": other_id}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1})
    conv["other_user"] = other_user
    
    return conv

@api_router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, page: int = 1, limit: int = 50, user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one({"id": conversation_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if user["id"] not in conv["participants"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    skip = (page - 1) * limit
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.messages.count_documents({"conversation_id": conversation_id})
    
    for msg in messages:
        sender = await db.users.find_one({"id": msg["sender_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1})
        msg["sender"] = sender
    
    return {"items": list(reversed(messages)), "total": total, "page": page}

@api_router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, data: MessageCreate, user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one({"id": conversation_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if user["id"] not in conv["participants"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    message = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "sender_id": user["id"],
        "text": data.text,
        "attachments": [],
        "created_at": now_utc()
    }
    await db.messages.insert_one(message)
    
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"last_message": data.text[:100], "last_message_at": now_utc()}}
    )
    
    return serialize_doc(message)

@api_router.post("/conversations/{conversation_id}/messages/attachment")
async def upload_message_attachment(
    conversation_id: str,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    conv = await db.conversations.find_one({"id": conversation_id})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    if user["id"] not in conv["participants"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"msg_{conversation_id}_{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    attachment_url = f"/uploads/{filename}"
    
    message = {
        "id": str(uuid.uuid4()),
        "conversation_id": conversation_id,
        "sender_id": user["id"],
        "text": "",
        "attachments": [attachment_url],
        "created_at": now_utc()
    }
    await db.messages.insert_one(message)
    
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"last_message": "[Pièce jointe]", "last_message_at": now_utc()}}
    )
    
    return serialize_doc(message)

# ==================== CONTRACTS ROUTES ====================
@api_router.post("/contracts")
async def create_contract(data: ContractCreate, user: dict = Depends(get_current_user)):
    req = await db.requests.find_one({"id": data.request_id})
    if not req:
        raise HTTPException(status_code=404, detail="Demande non trouvée")
    
    if user["role"] in ["CARRIER_INDIVIDUAL", "CARRIER_PRO"]:
        if data.carrier_id != user["id"]:
            raise HTTPException(status_code=403, detail="Non autorisé")
        shipper_id = req["user_id"]
        carrier_id = user["id"]
    elif user["role"] == "SHIPPER":
        shipper_id = user["id"]
        carrier_id = data.carrier_id
    elif user["role"] == "SHIPPER_CARRIER":
        # L'utilisateur peut être expéditeur ou transporteur selon le contexte
        if req["user_id"] == user["id"]:
            shipper_id = user["id"]
            carrier_id = data.carrier_id
        else:
            shipper_id = req["user_id"]
            carrier_id = user["id"]
    else:
        shipper_id = req["user_id"]
        carrier_id = data.carrier_id
    
    contract = {
        "id": str(uuid.uuid4()),
        "request_id": data.request_id,
        "offer_id": data.offer_id,
        "shipper_id": shipper_id,
        "carrier_id": carrier_id,
        "proposed_price": data.proposed_price,
        "status": ContractStatus.PROPOSED.value,
        "timeline": [{"status": "PROPOSED", "timestamp": now_utc()}],
        "created_at": now_utc()
    }
    await db.contracts.insert_one(contract)
    
    await db.requests.update_one({"id": data.request_id}, {"$set": {"status": RequestStatus.IN_NEGOTIATION.value}})
    
    return serialize_doc(contract)

@api_router.get("/contracts")
async def list_contracts(user: dict = Depends(get_current_user), status: Optional[ContractStatus] = None):
    query = {"$or": [{"shipper_id": user["id"]}, {"carrier_id": user["id"]}]}
    if status:
        query["status"] = status.value
    
    contracts = await db.contracts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for contract in contracts:
        req = await db.requests.find_one({"id": contract["request_id"]}, {"_id": 0})
        contract["request"] = req
        
        shipper = await db.users.find_one({"id": contract["shipper_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1})
        carrier = await db.users.find_one({"id": contract["carrier_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1})
        contract["shipper"] = shipper
        contract["carrier"] = carrier
    
    return contracts

@api_router.get("/contracts/{contract_id}")
async def get_contract(contract_id: str, user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    
    if user["id"] not in [contract["shipper_id"], contract["carrier_id"]] and user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    req = await db.requests.find_one({"id": contract["request_id"]}, {"_id": 0})
    contract["request"] = req
    
    if contract.get("offer_id"):
        offer = await db.offers.find_one({"id": contract["offer_id"]}, {"_id": 0})
        contract["offer"] = offer
    
    shipper = await db.users.find_one({"id": contract["shipper_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1, "phone": 1})
    carrier = await db.users.find_one({"id": contract["carrier_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "avatar_url": 1, "phone": 1})
    contract["shipper"] = shipper
    contract["carrier"] = carrier
    
    reviews = await db.reviews.find({"contract_id": contract_id}, {"_id": 0}).to_list(10)
    contract["reviews"] = reviews
    
    return contract

@api_router.post("/contracts/{contract_id}/accept")
async def accept_contract(contract_id: str, user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    
    if contract["shipper_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Seul l'expéditeur peut accepter")
    
    if contract["status"] != ContractStatus.PROPOSED.value:
        raise HTTPException(status_code=400, detail="Le contrat ne peut pas être accepté")
    
    await db.contracts.update_one(
        {"id": contract_id},
        {
            "$set": {"status": ContractStatus.ACCEPTED.value},
            "$push": {"timeline": {"status": "ACCEPTED", "timestamp": now_utc()}}
        }
    )
    
    await db.requests.update_one({"id": contract["request_id"]}, {"$set": {"status": RequestStatus.ACCEPTED.value}})
    
    return {"message": "Contrat accepté"}

@api_router.post("/contracts/{contract_id}/pickup")
async def pickup_contract(contract_id: str, user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    
    if contract["carrier_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Seul le transporteur peut confirmer la prise en charge")
    
    if contract["status"] != ContractStatus.ACCEPTED.value:
        raise HTTPException(status_code=400, detail="Le contrat doit être accepté d'abord")
    
    await db.contracts.update_one(
        {"id": contract_id},
        {
            "$set": {"status": ContractStatus.PICKED_UP.value},
            "$push": {"timeline": {"status": "PICKED_UP", "timestamp": now_utc()}}
        }
    )
    
    await db.requests.update_one({"id": contract["request_id"]}, {"$set": {"status": RequestStatus.IN_TRANSIT.value}})
    
    return {"message": "Prise en charge confirmée"}

@api_router.post("/contracts/{contract_id}/deliver")
async def deliver_contract(contract_id: str, user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    
    if contract["shipper_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Seul l'expéditeur peut confirmer la livraison")
    
    if contract["status"] != ContractStatus.PICKED_UP.value:
        raise HTTPException(status_code=400, detail="Le colis doit être en transit")
    
    await db.contracts.update_one(
        {"id": contract_id},
        {
            "$set": {"status": ContractStatus.DELIVERED.value},
            "$push": {"timeline": {"status": "DELIVERED", "timestamp": now_utc()}}
        }
    )
    
    await db.requests.update_one({"id": contract["request_id"]}, {"$set": {"status": RequestStatus.DELIVERED.value}})
    
    return {"message": "Livraison confirmée"}

@api_router.post("/contracts/{contract_id}/cancel")
async def cancel_contract(contract_id: str, user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    
    if user["id"] not in [contract["shipper_id"], contract["carrier_id"]]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    if contract["status"] == ContractStatus.DELIVERED.value:
        raise HTTPException(status_code=400, detail="Impossible d'annuler un contrat livré")
    
    await db.contracts.update_one(
        {"id": contract_id},
        {
            "$set": {"status": ContractStatus.CANCELLED.value},
            "$push": {"timeline": {"status": "CANCELLED", "timestamp": now_utc(), "by": user["id"]}}
        }
    )
    
    await db.requests.update_one({"id": contract["request_id"]}, {"$set": {"status": RequestStatus.CANCELLED.value}})
    
    return {"message": "Contrat annulé"}

# ==================== REVIEWS ROUTES ====================
@api_router.post("/contracts/{contract_id}/reviews")
async def create_review(contract_id: str, data: ReviewCreate, user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    
    if contract["status"] != ContractStatus.DELIVERED.value:
        raise HTTPException(status_code=400, detail="Le contrat doit être livré pour laisser un avis")
    
    if user["id"] == contract["shipper_id"]:
        reviewee_id = contract["carrier_id"]
    elif user["id"] == contract["carrier_id"]:
        reviewee_id = contract["shipper_id"]
    else:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    existing = await db.reviews.find_one({"contract_id": contract_id, "reviewer_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà laissé un avis")
    
    review = {
        "id": str(uuid.uuid4()),
        "contract_id": contract_id,
        "reviewer_id": user["id"],
        "reviewee_id": reviewee_id,
        "rating": data.rating,
        "comment": data.comment,
        "created_at": now_utc()
    }
    await db.reviews.insert_one(review)
    
    await db.users.update_one(
        {"id": reviewee_id},
        {"$inc": {"rating_sum": data.rating, "rating_count": 1}}
    )
    
    return serialize_doc(review)

# ==================== REPORTS ROUTES ====================
@api_router.post("/reports")
async def create_report(data: ReportCreate, user: dict = Depends(get_current_user)):
    report = {
        "id": str(uuid.uuid4()),
        "reporter_id": user["id"],
        "target_type": data.target_type.value,
        "target_id": data.target_id,
        "reason": data.reason,
        "details": data.details,
        "status": ReportStatus.OPEN.value,
        "created_at": now_utc()
    }
    await db.reports.insert_one(report)
    return serialize_doc(report)

# ==================== ADMIN ROUTES ====================
@api_router.get("/admin/users")
async def admin_list_users(
    user: dict = Depends(get_current_user),
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    page: int = 1,
    limit: int = 20
):
    await require_role(user, ["ADMIN"])
    
    query = {}
    if role:
        query["role"] = role.value
    if status:
        query["status"] = status.value
    
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"items": users, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.patch("/admin/users/{user_id}/suspend")
async def admin_suspend_user(user_id: str, user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    await db.users.update_one({"id": user_id}, {"$set": {"status": UserStatus.SUSPENDED.value}})
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": user["id"],
        "action": "SUSPEND_USER",
        "entity_type": "USER",
        "entity_id": user_id,
        "created_at": now_utc()
    })
    
    return {"message": "Utilisateur suspendu"}

@api_router.patch("/admin/users/{user_id}/unsuspend")
async def admin_unsuspend_user(user_id: str, user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    await db.users.update_one({"id": user_id}, {"$set": {"status": UserStatus.ACTIVE.value}})
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": user["id"],
        "action": "UNSUSPEND_USER",
        "entity_type": "USER",
        "entity_id": user_id,
        "created_at": now_utc()
    })
    
    return {"message": "Utilisateur réactivé"}

@api_router.get("/admin/verifications")
async def admin_list_verifications(
    user: dict = Depends(get_current_user),
    status: Optional[VerificationStatus] = None,
    page: int = 1,
    limit: int = 20
):
    await require_role(user, ["ADMIN"])
    
    query = {}
    if status:
        query["status"] = status.value
    
    skip = (page - 1) * limit
    verifications = await db.pro_verifications.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.pro_verifications.count_documents(query)
    
    for v in verifications:
        u = await db.users.find_one({"id": v["user_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "email": 1})
        v["user"] = u
    
    return {"items": verifications, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.patch("/admin/verifications/{verification_id}/approve")
async def admin_approve_verification(verification_id: str, user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    await db.pro_verifications.update_one({"id": verification_id}, {"$set": {"status": VerificationStatus.VERIFIED.value}})
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": user["id"],
        "action": "APPROVE_VERIFICATION",
        "entity_type": "VERIFICATION",
        "entity_id": verification_id,
        "created_at": now_utc()
    })
    
    return {"message": "Vérification approuvée"}

@api_router.patch("/admin/verifications/{verification_id}/reject")
async def admin_reject_verification(verification_id: str, user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    await db.pro_verifications.update_one({"id": verification_id}, {"$set": {"status": VerificationStatus.REJECTED.value}})
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": user["id"],
        "action": "REJECT_VERIFICATION",
        "entity_type": "VERIFICATION",
        "entity_id": verification_id,
        "created_at": now_utc()
    })
    
    return {"message": "Vérification rejetée"}

@api_router.get("/admin/reports")
async def admin_list_reports(
    user: dict = Depends(get_current_user),
    status: Optional[ReportStatus] = None,
    page: int = 1,
    limit: int = 20
):
    await require_role(user, ["ADMIN"])
    
    query = {}
    if status:
        query["status"] = status.value
    
    skip = (page - 1) * limit
    reports = await db.reports.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.reports.count_documents(query)
    
    for r in reports:
        reporter = await db.users.find_one({"id": r["reporter_id"]}, {"_id": 0, "first_name": 1, "last_name": 1})
        r["reporter"] = reporter
    
    return {"items": reports, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.patch("/admin/reports/{report_id}/close")
async def admin_close_report(report_id: str, user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    await db.reports.update_one({"id": report_id}, {"$set": {"status": ReportStatus.CLOSED.value}})
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": user["id"],
        "action": "CLOSE_REPORT",
        "entity_type": "REPORT",
        "entity_id": report_id,
        "created_at": now_utc()
    })
    
    return {"message": "Signalement clôturé"}

@api_router.get("/admin/requests")
async def admin_list_requests(user: dict = Depends(get_current_user), page: int = 1, limit: int = 20):
    await require_role(user, ["ADMIN"])
    
    skip = (page - 1) * limit
    requests = await db.requests.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.requests.count_documents({})
    
    for req in requests:
        u = await db.users.find_one({"id": req["user_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "email": 1})
        req["user"] = u
    
    return {"items": requests, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.delete("/admin/requests/{request_id}")
async def admin_delete_request(request_id: str, user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    await db.requests.update_one({"id": request_id}, {"$set": {"hidden": True}})
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": user["id"],
        "action": "HIDE_REQUEST",
        "entity_type": "REQUEST",
        "entity_id": request_id,
        "created_at": now_utc()
    })
    
    return {"message": "Demande masquée"}

@api_router.get("/admin/offers")
async def admin_list_offers(user: dict = Depends(get_current_user), page: int = 1, limit: int = 20):
    await require_role(user, ["ADMIN"])
    
    skip = (page - 1) * limit
    offers = await db.offers.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.offers.count_documents({})
    
    for offer in offers:
        u = await db.users.find_one({"id": offer["user_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "email": 1})
        offer["user"] = u
    
    return {"items": offers, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.delete("/admin/offers/{offer_id}")
async def admin_delete_offer(offer_id: str, user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    await db.offers.update_one({"id": offer_id}, {"$set": {"hidden": True}})
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": user["id"],
        "action": "HIDE_OFFER",
        "entity_type": "OFFER",
        "entity_id": offer_id,
        "created_at": now_utc()
    })
    
    return {"message": "Offre masquée"}

@api_router.get("/admin/stats")
async def admin_stats(user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    users_count = await db.users.count_documents({})
    requests_count = await db.requests.count_documents({})
    offers_count = await db.offers.count_documents({})
    contracts_count = await db.contracts.count_documents({})
    pending_verifications = await db.pro_verifications.count_documents({"status": "PENDING"})
    open_reports = await db.reports.count_documents({"status": "OPEN"})
    
    return {
        "users": users_count,
        "requests": requests_count,
        "offers": offers_count,
        "contracts": contracts_count,
        "pending_verifications": pending_verifications,
        "open_reports": open_reports
    }

# ==================== COUNTRIES MANAGEMENT ====================
@api_router.get("/countries")
async def list_countries(is_origin: Optional[bool] = None, is_destination: Optional[bool] = None):
    query = {"active": True}
    if is_origin is not None:
        query["is_origin"] = is_origin
    if is_destination is not None:
        query["is_destination"] = is_destination
    
    countries = await db.countries.find(query, {"_id": 0}).sort("name", 1).to_list(100)
    return countries

@api_router.post("/admin/countries")
async def create_country(data: CountryCreate, user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    existing = await db.countries.find_one({"code": data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Ce pays existe déjà")
    
    country = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "code": data.code.upper(),
        "is_origin": data.is_origin,
        "is_destination": data.is_destination,
        "active": True,
        "created_at": now_utc()
    }
    await db.countries.insert_one(country)
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": user["id"],
        "action": "CREATE_COUNTRY",
        "entity_type": "COUNTRY",
        "entity_id": country["id"],
        "created_at": now_utc()
    })
    
    return serialize_doc(country)

@api_router.get("/admin/countries")
async def admin_list_countries(user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    countries = await db.countries.find({}, {"_id": 0}).sort("name", 1).to_list(100)
    return countries

@api_router.patch("/admin/countries/{country_id}")
async def update_country(country_id: str, data: CountryUpdate, user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    country = await db.countries.find_one({"id": country_id})
    if not country:
        raise HTTPException(status_code=404, detail="Pays non trouvé")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "code" in update_data:
        update_data["code"] = update_data["code"].upper()
    
    if update_data:
        await db.countries.update_one({"id": country_id}, {"$set": update_data})
    
    return await db.countries.find_one({"id": country_id}, {"_id": 0})

@api_router.delete("/admin/countries/{country_id}")
async def delete_country(country_id: str, user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    country = await db.countries.find_one({"id": country_id})
    if not country:
        raise HTTPException(status_code=404, detail="Pays non trouvé")
    
    await db.countries.update_one({"id": country_id}, {"$set": {"active": False}})
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": user["id"],
        "action": "DELETE_COUNTRY",
        "entity_type": "COUNTRY",
        "entity_id": country_id,
        "created_at": now_utc()
    })
    
    return {"message": "Pays supprimé"}

# ==================== PLATFORM SETTINGS (COMMISSION) ====================
@api_router.get("/admin/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    settings = await db.platform_settings.find_one({"key": "main"}, {"_id": 0})
    if not settings:
        new_settings = {
            "key": "main",
            "commission_enabled": False,
            "shipper_commission_rate": 0.01,
            "carrier_commission_rate": 0.01,
            "created_at": now_utc()
        }
        await db.platform_settings.insert_one(new_settings)
        settings = await db.platform_settings.find_one({"key": "main"}, {"_id": 0})
    
    return settings

@api_router.patch("/admin/settings")
async def update_settings(data: PlatformSettingsUpdate, user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    settings = await db.platform_settings.find_one({"key": "main"})
    if not settings:
        new_settings = {
            "key": "main",
            "commission_enabled": False,
            "shipper_commission_rate": 0.01,
            "carrier_commission_rate": 0.01,
            "created_at": now_utc()
        }
        await db.platform_settings.insert_one(new_settings)
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = now_utc()
        await db.platform_settings.update_one({"key": "main"}, {"$set": update_data})
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": user["id"],
        "action": "UPDATE_SETTINGS",
        "entity_type": "SETTINGS",
        "entity_id": "main",
        "details": str(update_data),
        "created_at": now_utc()
    })
    
    return await db.platform_settings.find_one({"key": "main"}, {"_id": 0})

# ==================== PAYPAL PAYMENT ====================
@api_router.post("/payments/create")
async def create_payment(data: PaymentCreate, user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": data.contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    
    if contract["shipper_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Seul l'expéditeur peut effectuer le paiement")
    
    if contract["status"] != ContractStatus.ACCEPTED.value:
        raise HTTPException(status_code=400, detail="Le contrat doit être accepté pour procéder au paiement")
    
    existing_payment = await db.payments.find_one({"contract_id": data.contract_id, "status": {"$in": ["pending", "completed"]}})
    if existing_payment:
        raise HTTPException(status_code=400, detail="Un paiement existe déjà pour ce contrat")
    
    settings = await db.platform_settings.find_one({"key": "main"}, {"_id": 0})
    commission_enabled = settings.get("commission_enabled", False) if settings else False
    shipper_rate = settings.get("shipper_commission_rate", 0.01) if settings else 0.01
    carrier_rate = settings.get("carrier_commission_rate", 0.01) if settings else 0.01
    
    base_price = contract["proposed_price"]
    if commission_enabled:
        shipper_commission = round(base_price * shipper_rate, 2)
        carrier_commission = round(base_price * carrier_rate, 2)
        total_amount = round(base_price + shipper_commission, 2)
        carrier_payout = round(base_price - carrier_commission, 2)
    else:
        shipper_commission = 0
        carrier_commission = 0
        total_amount = base_price
        carrier_payout = base_price
    
    payment = paypalrestsdk.Payment({
        "intent": "sale",
        "payer": {"payment_method": "paypal"},
        "redirect_urls": {
            "return_url": data.return_url,
            "cancel_url": data.cancel_url
        },
        "transactions": [{
            "amount": {
                "total": str(total_amount),
                "currency": "EUR",
                "details": {
                    "subtotal": str(base_price),
                    "fee": str(shipper_commission)
                }
            },
            "description": f"LogiMatch - Contrat #{contract['id'][:8]}"
        }]
    })
    
    if payment.create():
        approval_url = next((link.href for link in payment.links if link.rel == "approval_url"), None)
        
        payment_record = {
            "id": str(uuid.uuid4()),
            "contract_id": data.contract_id,
            "paypal_payment_id": payment.id,
            "shipper_id": user["id"],
            "carrier_id": contract["carrier_id"],
            "base_price": base_price,
            "shipper_commission": shipper_commission,
            "carrier_commission": carrier_commission,
            "total_amount": total_amount,
            "carrier_payout": carrier_payout,
            "commission_enabled": commission_enabled,
            "status": "pending",
            "created_at": now_utc()
        }
        await db.payments.insert_one(payment_record)
        
        return {
            "payment_id": payment.id,
            "approval_url": approval_url,
            "total_amount": total_amount,
            "base_price": base_price,
            "shipper_commission": shipper_commission
        }
    else:
        logger.error(f"PayPal payment creation failed: {payment.error}")
        raise HTTPException(status_code=500, detail=f"Erreur PayPal: {payment.error}")

@api_router.post("/payments/execute")
async def execute_payment(payment_id: str, payer_id: str, user: dict = Depends(get_current_user)):
    payment_record = await db.payments.find_one({"paypal_payment_id": payment_id})
    if not payment_record:
        raise HTTPException(status_code=404, detail="Paiement non trouvé")
    
    if payment_record["shipper_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    if payment_record["status"] != "pending":
        raise HTTPException(status_code=400, detail="Ce paiement a déjà été traité")
    
    payment = paypalrestsdk.Payment.find(payment_id)
    
    if payment.execute({"payer_id": payer_id}):
        await db.payments.update_one(
            {"paypal_payment_id": payment_id},
            {"$set": {
                "status": "completed",
                "payer_id": payer_id,
                "completed_at": now_utc()
            }}
        )
        
        await db.contracts.update_one(
            {"id": payment_record["contract_id"]},
            {"$set": {"payment_status": "paid", "payment_id": payment_record["id"]}}
        )
        
        return {
            "message": "Paiement effectué avec succès",
            "total_paid": payment_record["total_amount"],
            "carrier_payout": payment_record["carrier_payout"]
        }
    else:
        await db.payments.update_one(
            {"paypal_payment_id": payment_id},
            {"$set": {"status": "failed", "error": str(payment.error)}}
        )
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'exécution du paiement: {payment.error}")

@api_router.get("/payments/contract/{contract_id}")
async def get_contract_payment(contract_id: str, user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contrat non trouvé")
    
    if user["id"] not in [contract["shipper_id"], contract["carrier_id"]] and user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    payment = await db.payments.find_one({"contract_id": contract_id}, {"_id": 0})
    return payment

@api_router.get("/admin/payments")
async def admin_list_payments(user: dict = Depends(get_current_user), page: int = 1, limit: int = 20):
    await require_role(user, ["ADMIN"])
    
    skip = (page - 1) * limit
    payments = await db.payments.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.payments.count_documents({})
    
    for p in payments:
        shipper = await db.users.find_one({"id": p["shipper_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "email": 1})
        carrier = await db.users.find_one({"id": p["carrier_id"]}, {"_id": 0, "first_name": 1, "last_name": 1, "email": 1})
        p["shipper"] = shipper
        p["carrier"] = carrier
    
    total_commission = await db.payments.aggregate([
        {"$match": {"status": "completed", "commission_enabled": True}},
        {"$group": {"_id": None, "total": {"$sum": {"$add": ["$shipper_commission", "$carrier_commission"]}}}}
    ]).to_list(1)
    
    return {
        "items": payments,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "total_commission": total_commission[0]["total"] if total_commission else 0
    }

# ==================== VISITOR ANALYTICS ====================
from fastapi import Request as FastAPIRequest

@api_router.post("/analytics/track")
async def track_visitor(data: VisitorTrack, request: FastAPIRequest):
    # Get client IP from headers (considering reverse proxy)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"
    
    visit = {
        "id": str(uuid.uuid4()),
        "ip": client_ip,
        "page": data.page,
        "referrer": data.referrer,
        "user_agent": data.user_agent,
        "screen_width": data.screen_width,
        "screen_height": data.screen_height,
        "language": data.language,
        "timestamp": now_utc()
    }
    
    await db.visitor_analytics.insert_one(visit)
    
    # Update daily stats
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.daily_stats.update_one(
        {"date": today},
        {
            "$inc": {"visits": 1, "unique_ips": 0},
            "$addToSet": {"ips": client_ip},
            "$setOnInsert": {"date": today, "created_at": now_utc()}
        },
        upsert=True
    )
    
    # Update unique IPs count
    stats = await db.daily_stats.find_one({"date": today})
    if stats:
        unique_count = len(stats.get("ips", []))
        await db.daily_stats.update_one(
            {"date": today},
            {"$set": {"unique_ips": unique_count}}
        )
    
    return {"status": "tracked"}

@api_router.get("/admin/analytics")
async def get_analytics(user: dict = Depends(get_current_user), days: int = 30):
    await require_role(user, ["ADMIN"])
    
    # Get date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Get daily stats
    daily_stats = await db.daily_stats.find(
        {"date": {"$gte": start_date.strftime("%Y-%m-%d")}},
        {"_id": 0}
    ).sort("date", -1).to_list(days)
    
    # Get total stats
    total_visits = await db.visitor_analytics.count_documents({})
    
    # Get unique IPs (all time)
    unique_ips_pipeline = [
        {"$group": {"_id": "$ip"}},
        {"$count": "total"}
    ]
    unique_ips_result = await db.visitor_analytics.aggregate(unique_ips_pipeline).to_list(1)
    total_unique_ips = unique_ips_result[0]["total"] if unique_ips_result else 0
    
    # Get top pages
    top_pages_pipeline = [
        {"$group": {"_id": "$page", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    top_pages = await db.visitor_analytics.aggregate(top_pages_pipeline).to_list(10)
    
    # Get recent visits with IP info
    recent_visits = await db.visitor_analytics.find(
        {},
        {"_id": 0, "id": 1, "ip": 1, "page": 1, "timestamp": 1, "user_agent": 1, "language": 1}
    ).sort("timestamp", -1).limit(50).to_list(50)
    
    # Get IP statistics
    ip_stats_pipeline = [
        {"$group": {"_id": "$ip", "visits": {"$sum": 1}, "last_visit": {"$max": "$timestamp"}}},
        {"$sort": {"visits": -1}},
        {"$limit": 100}
    ]
    ip_stats = await db.visitor_analytics.aggregate(ip_stats_pipeline).to_list(100)
    
    # Today's stats
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_stats = await db.daily_stats.find_one({"date": today}, {"_id": 0})
    
    return {
        "total_visits": total_visits,
        "total_unique_ips": total_unique_ips,
        "today": today_stats or {"visits": 0, "unique_ips": 0},
        "daily_stats": daily_stats,
        "top_pages": [{"page": p["_id"], "count": p["count"]} for p in top_pages],
        "recent_visits": recent_visits,
        "ip_stats": [{"ip": ip["_id"], "visits": ip["visits"], "last_visit": ip["last_visit"]} for ip in ip_stats]
    }

# ==================== GOOGLE ADS SETTINGS ====================
@api_router.get("/admin/ads-settings")
async def get_ads_settings(user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    settings = await db.ads_settings.find_one({"key": "google_ads"}, {"_id": 0})
    if not settings:
        settings = {
            "key": "google_ads",
            "ads_enabled": False,
            "publisher_id": "",
            "header_ad_slot": "",
            "sidebar_ad_slot": "",
            "footer_ad_slot": "",
            "in_content_ad_slot": "",
            "created_at": now_utc()
        }
        await db.ads_settings.insert_one(settings)
        settings = await db.ads_settings.find_one({"key": "google_ads"}, {"_id": 0})
    
    return settings

@api_router.patch("/admin/ads-settings")
async def update_ads_settings(data: GoogleAdsSettingsUpdate, user: dict = Depends(get_current_user)):
    await require_role(user, ["ADMIN"])
    
    settings = await db.ads_settings.find_one({"key": "google_ads"})
    if not settings:
        new_settings = {
            "key": "google_ads",
            "ads_enabled": False,
            "publisher_id": "",
            "header_ad_slot": "",
            "sidebar_ad_slot": "",
            "footer_ad_slot": "",
            "in_content_ad_slot": "",
            "created_at": now_utc()
        }
        await db.ads_settings.insert_one(new_settings)
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = now_utc()
        await db.ads_settings.update_one({"key": "google_ads"}, {"$set": update_data})
    
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": user["id"],
        "action": "UPDATE_ADS_SETTINGS",
        "entity_type": "ADS_SETTINGS",
        "entity_id": "google_ads",
        "details": str(update_data),
        "created_at": now_utc()
    })
    
    return await db.ads_settings.find_one({"key": "google_ads"}, {"_id": 0})

@api_router.get("/ads-config")
async def get_public_ads_config():
    """Public endpoint to get ads configuration for frontend"""
    settings = await db.ads_settings.find_one({"key": "google_ads"}, {"_id": 0})
    if not settings or not settings.get("ads_enabled"):
        return {"ads_enabled": False}
    
    return {
        "ads_enabled": settings.get("ads_enabled", False),
        "publisher_id": settings.get("publisher_id", ""),
        "header_ad_slot": settings.get("header_ad_slot", ""),
        "sidebar_ad_slot": settings.get("sidebar_ad_slot", ""),
        "footer_ad_slot": settings.get("footer_ad_slot", ""),
        "in_content_ad_slot": settings.get("in_content_ad_slot", "")
    }

# ==================== SEED DATA ====================
@api_router.post("/seed")
async def seed_data():
    existing = await db.users.find_one({"email": "admin@logimatch.com"})
    if existing:
        return {"message": "Données déjà initialisées"}
    
    admin_id = str(uuid.uuid4())
    admin = {
        "id": admin_id,
        "email": "admin@logimatch.com",
        "password_hash": hash_password("admin123"),
        "role": "ADMIN",
        "status": "ACTIVE",
        "phone_verified": True,
        "first_name": "Admin",
        "last_name": "LogiMatch",
        "phone": "+33600000000",
        "country": "France",
        "city": "Paris",
        "avatar_url": None,
        "bio": "Administrateur de la plateforme",
        "rating_sum": 0,
        "rating_count": 0,
        "created_at": now_utc()
    }
    await db.users.insert_one(admin)
    
    shipper1_id = str(uuid.uuid4())
    shipper1 = {
        "id": shipper1_id,
        "email": "marie@example.com",
        "password_hash": hash_password("password123"),
        "role": "SHIPPER",
        "status": "ACTIVE",
        "phone_verified": True,
        "first_name": "Marie",
        "last_name": "Dupont",
        "phone": "+33612345678",
        "country": "France",
        "city": "Lyon",
        "avatar_url": None,
        "bio": "J'envoie régulièrement des colis en Tunisie",
        "rating_sum": 9,
        "rating_count": 2,
        "created_at": now_utc()
    }
    await db.users.insert_one(shipper1)
    
    shipper2_id = str(uuid.uuid4())
    shipper2 = {
        "id": shipper2_id,
        "email": "ahmed@example.com",
        "password_hash": hash_password("password123"),
        "role": "SHIPPER",
        "status": "ACTIVE",
        "phone_verified": True,
        "first_name": "Ahmed",
        "last_name": "Ben Ali",
        "phone": "+21698765432",
        "country": "Tunisie",
        "city": "Tunis",
        "avatar_url": None,
        "bio": "Envoi de colis vers la France",
        "rating_sum": 5,
        "rating_count": 1,
        "created_at": now_utc()
    }
    await db.users.insert_one(shipper2)
    
    carrier_pro_id = str(uuid.uuid4())
    carrier_pro = {
        "id": carrier_pro_id,
        "email": "transport.pro@example.com",
        "password_hash": hash_password("password123"),
        "role": "CARRIER_PRO",
        "status": "ACTIVE",
        "phone_verified": True,
        "first_name": "Jean",
        "last_name": "Martin",
        "phone": "+33698765432",
        "country": "France",
        "city": "Marseille",
        "avatar_url": None,
        "bio": "Transport professionnel France-Tunisie depuis 10 ans",
        "rating_sum": 14,
        "rating_count": 3,
        "created_at": now_utc()
    }
    await db.users.insert_one(carrier_pro)
    
    await db.pro_verifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": carrier_pro_id,
        "company_name": "Trans-Med Express",
        "siret": "12345678901234",
        "documents": [],
        "status": "VERIFIED",
        "created_at": now_utc()
    })
    
    carrier_ind_id = str(uuid.uuid4())
    carrier_ind = {
        "id": carrier_ind_id,
        "email": "salim@example.com",
        "password_hash": hash_password("password123"),
        "role": "CARRIER_INDIVIDUAL",
        "status": "ACTIVE",
        "phone_verified": True,
        "first_name": "Salim",
        "last_name": "Bouaziz",
        "phone": "+21655555555",
        "country": "Tunisie",
        "city": "Sousse",
        "avatar_url": None,
        "bio": "Je fais des allers-retours réguliers",
        "rating_sum": 4,
        "rating_count": 1,
        "created_at": now_utc()
    }
    await db.users.insert_one(carrier_ind)
    
    request1_id = str(uuid.uuid4())
    request1 = {
        "id": request1_id,
        "user_id": shipper1_id,
        "origin_country": "France",
        "origin_city": "Lyon",
        "destination_country": "Tunisie",
        "destination_city": "Tunis",
        "weight": 5.0,
        "width": 30,
        "height": 20,
        "length": 40,
        "package_type": "Vêtements",
        "mode": "TERRESTRIAL",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
        "description": "Envoi de vêtements pour la famille",
        "photos": [],
        "status": "OPEN",
        "hidden": False,
        "created_at": now_utc()
    }
    await db.requests.insert_one(request1)
    
    request2_id = str(uuid.uuid4())
    request2 = {
        "id": request2_id,
        "user_id": shipper2_id,
        "origin_country": "Tunisie",
        "origin_city": "Tunis",
        "destination_country": "France",
        "destination_city": "Paris",
        "weight": 2.0,
        "width": 15,
        "height": 10,
        "length": 20,
        "package_type": "Documents",
        "mode": "AIR",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "description": "Documents urgents à envoyer",
        "photos": [],
        "status": "DELIVERED",
        "hidden": False,
        "created_at": now_utc()
    }
    await db.requests.insert_one(request2)
    
    offer1_id = str(uuid.uuid4())
    offer1 = {
        "id": offer1_id,
        "user_id": carrier_pro_id,
        "origin_country": "France",
        "origin_city": "Marseille",
        "destination_country": "Tunisie",
        "destination_city": "Tunis",
        "departure_date": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
        "arrival_date": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
        "capacity_kg": 100,
        "mode": "TERRESTRIAL",
        "price_per_kg": 8.0,
        "conditions": "Pas de produits alimentaires périssables",
        "status": "ACTIVE",
        "hidden": False,
        "created_at": now_utc()
    }
    await db.offers.insert_one(offer1)
    
    offer2_id = str(uuid.uuid4())
    offer2 = {
        "id": offer2_id,
        "user_id": carrier_ind_id,
        "origin_country": "Tunisie",
        "origin_city": "Sousse",
        "destination_country": "France",
        "destination_city": "Paris",
        "departure_date": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
        "arrival_date": (datetime.now(timezone.utc) + timedelta(days=11)).isoformat(),
        "capacity_kg": 20,
        "mode": "AIR",
        "price_per_kg": 15.0,
        "conditions": "Bagages à main uniquement",
        "status": "ACTIVE",
        "hidden": False,
        "created_at": now_utc()
    }
    await db.offers.insert_one(offer2)
    
    contract_id = str(uuid.uuid4())
    contract = {
        "id": contract_id,
        "request_id": request2_id,
        "offer_id": None,
        "shipper_id": shipper2_id,
        "carrier_id": carrier_pro_id,
        "proposed_price": 30.0,
        "status": "DELIVERED",
        "timeline": [
            {"status": "PROPOSED", "timestamp": (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()},
            {"status": "ACCEPTED", "timestamp": (datetime.now(timezone.utc) - timedelta(days=9)).isoformat()},
            {"status": "PICKED_UP", "timestamp": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()},
            {"status": "DELIVERED", "timestamp": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()}
        ],
        "created_at": (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
    }
    await db.contracts.insert_one(contract)
    
    await db.reviews.insert_one({
        "id": str(uuid.uuid4()),
        "contract_id": contract_id,
        "reviewer_id": shipper2_id,
        "reviewee_id": carrier_pro_id,
        "rating": 5,
        "comment": "Excellent service, très professionnel et ponctuel!",
        "created_at": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat()
    })
    
    await db.reviews.insert_one({
        "id": str(uuid.uuid4()),
        "contract_id": contract_id,
        "reviewer_id": carrier_pro_id,
        "reviewee_id": shipper2_id,
        "rating": 5,
        "comment": "Expéditeur sérieux, colis bien préparé",
        "created_at": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat()
    })
    
    conv_id = str(uuid.uuid4())
    await db.conversations.insert_one({
        "id": conv_id,
        "request_id": request1_id,
        "offer_id": None,
        "participants": sorted([shipper1_id, carrier_pro_id]),
        "last_message": "D'accord, je confirme la prise en charge demain",
        "last_message_at": now_utc(),
        "created_at": now_utc()
    })
    
    await db.messages.insert_one({
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "sender_id": shipper1_id,
        "text": "Bonjour, je suis intéressée par votre offre de transport",
        "attachments": [],
        "created_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    })
    
    await db.messages.insert_one({
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "sender_id": carrier_pro_id,
        "text": "Bonjour! Oui bien sûr, je peux prendre votre colis. Il fait 5kg c'est ça?",
        "attachments": [],
        "created_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    })
    
    await db.messages.insert_one({
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "sender_id": shipper1_id,
        "text": "Oui exactement, ce sont des vêtements pour ma famille à Tunis",
        "attachments": [],
        "created_at": (datetime.now(timezone.utc) - timedelta(minutes=30)).isoformat()
    })
    
    await db.messages.insert_one({
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "sender_id": carrier_pro_id,
        "text": "D'accord, je confirme la prise en charge demain",
        "attachments": [],
        "created_at": now_utc()
    })
    
    # Seed countries
    default_countries = [
        {"name": "France", "code": "FR", "is_origin": True, "is_destination": True},
        {"name": "Tunisie", "code": "TN", "is_origin": True, "is_destination": True},
    ]
    
    for country_data in default_countries:
        existing_country = await db.countries.find_one({"code": country_data["code"]})
        if not existing_country:
            await db.countries.insert_one({
                "id": str(uuid.uuid4()),
                **country_data,
                "active": True,
                "created_at": now_utc()
            })
    
    # Seed platform settings
    existing_settings = await db.platform_settings.find_one({"key": "main"})
    if not existing_settings:
        await db.platform_settings.insert_one({
            "key": "main",
            "commission_enabled": False,
            "shipper_commission_rate": 0.01,
            "carrier_commission_rate": 0.01,
            "created_at": now_utc()
        })
    
    return {"message": "Données de test créées avec succès"}

# ==================== ROOT & STATIC ====================
@api_router.get("/")
async def root():
    return {"message": "Waselni API v1.0", "docs": "/docs"}

app.include_router(api_router)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
