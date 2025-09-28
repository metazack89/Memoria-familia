from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os
import uuid
import jwt
import bcrypt
import logging
from dotenv import load_dotenv
import shutil
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import tempfile

# Configuración
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'memoria_viva')]

# Configuración de uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# JWT Configuration  
JWT_SECRET = os.environ.get('JWT_SECRET', 'memoria-viva-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 días

# FastAPI app
app = FastAPI(
    title="Memoria Viva API",
    description="API para álbum digital familiar",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    nombre: str
    apellido: str
    rol: str = "miembro"  # admin, miembro
    familia_id: str
    avatar_url: Optional[str] = None
    activo: bool = True
    fecha_registro: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ultimo_acceso: Optional[datetime] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    apellido: str
    codigo_familia: Optional[str] = None  # Para unirse a familia existente

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Familia(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    descripcion: Optional[str] = None
    codigo_invitacion: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
    admin_id: str
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    configuracion: Dict[str, Any] = Field(default_factory=dict)

class Album(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo: str
    descripcion: Optional[str] = None
    familia_id: str
    creador_id: str
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    foto_portada: Optional[str] = None
    privacidad: str = "familia"  # familia, privado
    etiquetas: List[str] = Field(default_factory=list)

class Foto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre_archivo: str
    archivo_url: str
    miniatura_url: Optional[str] = None
    album_id: str
    subida_por: str
    fecha_subida: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    fecha_captura: Optional[datetime] = None
    ubicacion: Optional[Dict[str, float]] = None  # {lat, lng}
    lugar_nombre: Optional[str] = None
    personas_etiquetadas: List[str] = Field(default_factory=list)
    descripcion: Optional[str] = None
    anecdota: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class FotoCreate(BaseModel):
    album_id: str
    descripcion: Optional[str] = None
    fecha_captura: Optional[datetime] = None
    lugar_nombre: Optional[str] = None
    personas_etiquetadas: List[str] = Field(default_factory=list)
    anecdota: Optional[str] = None

class Comentario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    foto_id: str
    usuario_id: str
    contenido: str
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    editado: bool = False

class Reaccion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    foto_id: str
    usuario_id: str
    tipo: str  # like, love, laugh, wow, sad
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Utilidades de autenticación
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = await db.usuarios.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    
    return User(**user)

# Extracción de metadatos de fotos
class PhotoMetadataExtractor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def extract_metadata(self, image_path: str) -> Dict[str, Any]:
        metadata = {}
        try:
            with Image.open(image_path) as image:
                exif_data = image.getexif()
                
                if exif_data:
                    # Información básica de la cámara
                    metadata['camera_make'] = exif_data.get(TAGS.get('Make', 'Make'))
                    metadata['camera_model'] = exif_data.get(TAGS.get('Model', 'Model'))
                    
                    # Fecha de captura
                    datetime_original = exif_data.get(TAGS.get('DateTimeOriginal', 'DateTimeOriginal'))
                    if datetime_original:
                        try:
                            metadata['fecha_captura'] = datetime.strptime(datetime_original, '%Y:%m:%d %H:%M:%S')
                        except ValueError:
                            pass
                    
                    # Información GPS
                    gps_info = exif_data.get(TAGS.get('GPSInfo', 'GPSInfo'))
                    if gps_info:
                        coordenadas = self._extract_gps_coordinates(gps_info)
                        if coordenadas:
                            metadata['ubicacion'] = {
                                'lat': coordenadas[0],
                                'lng': coordenadas[1]
                            }
                            
                            # Altitud si está disponible
                            if GPSTAGS.get('GPSAltitude', 'GPSAltitude') in gps_info:
                                altitude_data = gps_info[GPSTAGS.get('GPSAltitude', 'GPSAltitude')]
                                if altitude_data:
                                    metadata['altitud'] = float(altitude_data)
                
                # Dimensiones de la imagen
                metadata['ancho'] = image.width
                metadata['alto'] = image.height
                metadata['formato'] = image.format
                
        except Exception as e:
            self.logger.error(f"Error extrayendo metadatos de {image_path}: {str(e)}")
        
        return metadata
    
    def _extract_gps_coordinates(self, gps_info: Dict) -> Optional[tuple]:
        try:
            # Obtener información de latitud
            lat_data = gps_info.get(GPSTAGS.get('GPSLatitude', 'GPSLatitude'))
            lat_ref = gps_info.get(GPSTAGS.get('GPSLatitudeRef', 'GPSLatitudeRef'))
            
            # Obtener información de longitud
            lon_data = gps_info.get(GPSTAGS.get('GPSLongitude', 'GPSLongitude'))
            lon_ref = gps_info.get(GPSTAGS.get('GPSLongitudeRef', 'GPSLongitudeRef'))
            
            if lat_data and lat_ref and lon_data and lon_ref:
                latitude = self._convert_to_decimal(lat_data, lat_ref)
                longitude = self._convert_to_decimal(lon_data, lon_ref)
                return latitude, longitude
                
        except Exception as e:
            self.logger.error(f"Error analizando coordenadas GPS: {str(e)}")
            
        return None
    
    def _convert_to_decimal(self, coordinate_data: tuple, reference: str) -> float:
        degrees, minutes, seconds = coordinate_data
        decimal = float(degrees) + float(minutes)/60 + float(seconds)/3600
        
        if reference in ['S', 'W']:
            decimal = -decimal
            
        return decimal

# Endpoints de Autenticación
@app.post("/api/auth/register")
async def register(user_data: UserCreate):
    """Registro de nuevo usuario"""
    # Verificar si el email ya existe
    existing_user = await db.usuarios.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Hash de la contraseña
    hashed_password = hash_password(user_data.password)
    
    # Crear o unirse a familia
    familia_id = None
    if user_data.codigo_familia:
        # Unirse a familia existente
        familia = await db.familias.find_one({"codigo_invitacion": user_data.codigo_familia.upper()})
        if not familia:
            raise HTTPException(status_code=400, detail="Código de familia inválido")
        familia_id = familia["id"]
    else:
        # Crear nueva familia
        nueva_familia = Familia(
            nombre=f"Familia {user_data.apellido}",
            admin_id="temp"  # Se actualizará después
        )
        await db.familias.insert_one(nueva_familia.dict())
        familia_id = nueva_familia.id
    
    # Crear usuario
    nuevo_usuario = User(
        email=user_data.email,
        nombre=user_data.nombre,
        apellido=user_data.apellido,
        familia_id=familia_id,
        rol="admin" if not user_data.codigo_familia else "miembro"
    )
    
    # Guardar usuario y contraseña
    user_dict = nuevo_usuario.dict()
    user_dict["password"] = hashed_password
    await db.usuarios.insert_one(user_dict)
    
    # Actualizar admin de familia si es nueva familia
    if not user_data.codigo_familia:
        await db.familias.update_one(
            {"id": familia_id},
            {"$set": {"admin_id": nuevo_usuario.id}}
        )
    
    # Crear token
    access_token = create_access_token({"sub": nuevo_usuario.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": nuevo_usuario.dict()
    }

@app.post("/api/auth/login")
async def login(login_data: UserLogin):
    """Inicio de sesión"""
    # Buscar usuario
    user_doc = await db.usuarios.find_one({"email": login_data.email})
    if not user_doc or not verify_password(login_data.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not user_doc.get("activo", True):
        raise HTTPException(status_code=401, detail="Cuenta desactivada")
    
    # Actualizar último acceso
    await db.usuarios.update_one(
        {"id": user_doc["id"]},
        {"$set": {"ultimo_acceso": datetime.now(timezone.utc)}}
    )
    
    # Crear token
    access_token = create_access_token({"sub": user_doc["id"]})
    
    user = User(**user_doc)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.dict()
    }

@app.get("/api/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    return current_user

# Endpoints de Familia
@app.get("/api/familia")
async def get_familia(current_user: User = Depends(get_current_user)):
    """Obtener información de la familia"""
    familia = await db.familias.find_one({"id": current_user.familia_id})
    if not familia:
        raise HTTPException(status_code=404, detail="Familia no encontrada")
    
    # Obtener miembros de la familia
    miembros = await db.usuarios.find({"familia_id": current_user.familia_id}).to_list(None)
    familia["miembros"] = [User(**m).dict() for m in miembros]
    
    return familia

@app.get("/api/familia/codigo-invitacion")
async def get_codigo_invitacion(current_user: User = Depends(get_current_user)):
    """Obtener código de invitación familiar (solo admin)"""
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Sin permisos")
    
    familia = await db.familias.find_one({"id": current_user.familia_id})
    if not familia:
        raise HTTPException(status_code=404, detail="Familia no encontrada")
    
    return {"codigo_invitacion": familia["codigo_invitacion"]}

# Endpoints de Álbumes
@app.get("/api/albumes")
async def get_albumes(current_user: User = Depends(get_current_user)):
    """Obtener álbumes de la familia"""
    albumes = await db.albumes.find({"familia_id": current_user.familia_id}).to_list(None)
    return [Album(**album).dict() for album in albumes]

@app.post("/api/albumes")
async def create_album(album_data: dict, current_user: User = Depends(get_current_user)):
    """Crear nuevo álbum"""
    nuevo_album = Album(
        titulo=album_data["titulo"],
        descripcion=album_data.get("descripcion"),
        familia_id=current_user.familia_id,
        creador_id=current_user.id,
        privacidad=album_data.get("privacidad", "familia"),
        etiquetas=album_data.get("etiquetas", [])
    )
    
    await db.albumes.insert_one(nuevo_album.dict())
    return nuevo_album.dict()

@app.get("/api/albumes/{album_id}")
async def get_album(album_id: str, current_user: User = Depends(get_current_user)):
    """Obtener álbum específico"""
    album = await db.albumes.find_one({"id": album_id, "familia_id": current_user.familia_id})
    if not album:
        raise HTTPException(status_code=404, detail="Álbum no encontrado")
    
    # Obtener fotos del álbum
    fotos = await db.fotos.find({"album_id": album_id}).to_list(None)
    album["fotos"] = [Foto(**foto).dict() for foto in fotos]
    
    return album

# Endpoints de Fotos
@app.post("/api/fotos/upload")
async def upload_fotos(
    files: List[UploadFile] = File(...),
    album_id: str = Form(...),
    descripcion: Optional[str] = Form(None),
    lugar_nombre: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Subir fotos a un álbum"""
    # Verificar que el álbum existe y pertenece a la familia
    album = await db.albumes.find_one({"id": album_id, "familia_id": current_user.familia_id})
    if not album:
        raise HTTPException(status_code=404, detail="Álbum no encontrado")
    
    extractor = PhotoMetadataExtractor()
    fotos_subidas = []
    
    for file in files:
        if not file.content_type or not file.content_type.startswith('image/'):
            continue
        
        try:
            # Generar nombre único
            file_extension = Path(file.filename).suffix.lower()
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = UPLOAD_DIR / unique_filename
            
            # Guardar archivo
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Extraer metadatos
            metadata = extractor.extract_metadata(str(file_path))
            
            # Crear registro de foto
            nueva_foto = Foto(
                nombre_archivo=file.filename,
                archivo_url=f"/api/fotos/files/{unique_filename}",
                album_id=album_id,
                subida_por=current_user.id,
                descripcion=descripcion,
                lugar_nombre=lugar_nombre,
                fecha_captura=metadata.get('fecha_captura'),
                ubicacion=metadata.get('ubicacion'),
                metadata=metadata
            )
            
            await db.fotos.insert_one(nueva_foto.dict())
            fotos_subidas.append(nueva_foto.dict())
            
            logger.info(f"Foto subida exitosamente: {file.filename}")
            
        except Exception as e:
            logger.error(f"Error procesando archivo {file.filename}: {str(e)}")
            if file_path.exists():
                file_path.unlink()
            continue
    
    return {
        "mensaje": f"Se subieron {len(fotos_subidas)} fotos exitosamente",
        "fotos": fotos_subidas
    }

@app.get("/api/fotos/files/{filename}")
async def get_foto_file(filename: str):
    """Servir archivo de foto"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    return FileResponse(path=str(file_path))

@app.get("/api/fotos/{foto_id}")
async def get_foto(foto_id: str, current_user: User = Depends(get_current_user)):
    """Obtener información de una foto"""
    foto = await db.fotos.find_one({"id": foto_id})
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    
    # Verificar acceso familiar
    album = await db.albumes.find_one({"id": foto["album_id"], "familia_id": current_user.familia_id})
    if not album:
        raise HTTPException(status_code=403, detail="Sin acceso a esta foto")
    
    return Foto(**foto).dict()

# Endpoints de Timeline
@app.get("/api/timeline")
async def get_timeline(current_user: User = Depends(get_current_user)):
    """Obtener timeline de fotos familiares"""
    # Obtener todas las fotos de la familia ordenadas por fecha
    pipeline = [
        {
            "$lookup": {
                "from": "albumes",
                "localField": "album_id",
                "foreignField": "id",
                "as": "album"
            }
        },
        {
            "$match": {
                "album.familia_id": current_user.familia_id
            }
        },
        {
            "$sort": {
                "fecha_captura": -1,
                "fecha_subida": -1
            }
        },
        {
            "$limit": 100
        }
    ]
    
    fotos = await db.fotos.aggregate(pipeline).to_list(None)
    return fotos

# Endpoints de Mapa
@app.get("/api/mapa/fotos")
async def get_fotos_mapa(current_user: User = Depends(get_current_user)):
    """Obtener fotos con ubicación para el mapa"""
    pipeline = [
        {
            "$lookup": {
                "from": "albumes",
                "localField": "album_id",
                "foreignField": "id",
                "as": "album"
            }
        },
        {
            "$match": {
                "album.familia_id": current_user.familia_id,
                "ubicacion": {"$ne": None}
            }
        }
    ]
    
    fotos = await db.fotos.aggregate(pipeline).to_list(None)
    return fotos

# Endpoints de Comentarios y Reacciones
@app.post("/api/fotos/{foto_id}/comentarios")
async def add_comentario(
    foto_id: str,
    comentario_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Agregar comentario a una foto"""
    # Verificar acceso a la foto
    foto = await db.fotos.find_one({"id": foto_id})
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    
    album = await db.albumes.find_one({"id": foto["album_id"], "familia_id": current_user.familia_id})
    if not album:
        raise HTTPException(status_code=403, detail="Sin acceso")
    
    nuevo_comentario = Comentario(
        foto_id=foto_id,
        usuario_id=current_user.id,
        contenido=comentario_data["contenido"]
    )
    
    await db.comentarios.insert_one(nuevo_comentario.dict())
    return nuevo_comentario.dict()

@app.get("/api/fotos/{foto_id}/comentarios")
async def get_comentarios(foto_id: str, current_user: User = Depends(get_current_user)):
    """Obtener comentarios de una foto"""
    # Verificar acceso
    foto = await db.fotos.find_one({"id": foto_id})
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    
    album = await db.albumes.find_one({"id": foto["album_id"], "familia_id": current_user.familia_id})
    if not album:
        raise HTTPException(status_code=403, detail="Sin acceso")
    
    comentarios = await db.comentarios.find({"foto_id": foto_id}).to_list(None)
    return [Comentario(**c).dict() for c in comentarios]

@app.post("/api/fotos/{foto_id}/reacciones")
async def add_reaccion(
    foto_id: str,
    reaccion_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Agregar/actualizar reacción a una foto"""
    # Verificar acceso
    foto = await db.fotos.find_one({"id": foto_id})
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    
    album = await db.albumes.find_one({"id": foto["album_id"], "familia_id": current_user.familia_id})
    if not album:
        raise HTTPException(status_code=403, detail="Sin acceso")
    
    # Verificar si ya existe reacción del usuario
    existing_reaction = await db.reacciones.find_one({
        "foto_id": foto_id,
        "usuario_id": current_user.id
    })
    
    if existing_reaction:
        # Actualizar reacción existente
        await db.reacciones.update_one(
            {"id": existing_reaction["id"]},
            {"$set": {"tipo": reaccion_data["tipo"]}}
        )
        return {"mensaje": "Reacción actualizada"}
    else:
        # Crear nueva reacción
        nueva_reaccion = Reaccion(
            foto_id=foto_id,
            usuario_id=current_user.id,
            tipo=reaccion_data["tipo"]
        )
        await db.reacciones.insert_one(nueva_reaccion.dict())
        return nueva_reaccion.dict()

# Health check
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "Memoria Viva API"
    }

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)