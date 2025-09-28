# 📸 Memoria Familia  

Un **álbum digital en línea** donde los recuerdos de tu familia cobran vida.  
Guarda, organiza y revive momentos especiales con fotos, historias y una línea del tiempo interactiva.  

---

## ✨ Funcionalidades principales
- 🔐 **Autenticación completa**: registro, login, logout y recuperación de contraseña.  
- 📂 **Álbumes familiares**: crea, organiza y administra fotos con un CRUD intuitivo.  
- 🕰️ **Línea del tiempo**: visualiza fotos en orden cronológico para revivir cada etapa.  
- 🌍 **Mapa de recuerdos**: ubica dónde ocurrieron esos momentos especiales.  
- 🌳 **Árbol genealógico**: asocia fotos a cada generación de la familia.  
- 💬 **Comentarios y reacciones**: comparte anécdotas y revive emociones en cada foto.  
- 🎶 **Presentaciones automáticas**: genera slideshows con música familiar.  

---

## 🛠️ Tecnologías utilizadas

### 🔹 Frontend
- ⚛️ **React + Vite** → interfaz rápida y moderna.  
- 🎨 **TailwindCSS** → diseño limpio y responsivo.  
- 🧩 **shadcn/ui** → componentes accesibles y estilizados.  
- 🎬 **Framer Motion** → animaciones fluidas.  
- 🛤️ **React Router** → navegación entre páginas protegidas.  

### 🔹 Backend
- 🐍 **Python (Flask/FastAPI)** → API ligera y eficiente (en `backend/server.py`).  
- 🗂️ **CRUD endpoints** → para álbumes, usuarios y fotos.  
- 🔐 **JWT + bcrypt** → autenticación y seguridad de contraseñas.  

### 🔹 Base de datos y almacenamiento
- 🐘 **PostgreSQL** → datos estructurados de usuarios, álbumes y genealogía.  
- ☁️ **Cloudinary / S3** → almacenamiento y optimización de imágenes.  

### 🔹 DevOps & Otros
- 🐳 **Docker** (opcional) → despliegue sencillo.  
- ⚡ **Yarn** → gestor de dependencias frontend.  
- 🧪 **Jest + React Testing Library** → pruebas de frontend.  
- 🧪 **Pytest** → pruebas de backend.  

---

## 🚀 Instalación y uso

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/tuusuario/memoria-familia.git
cd memoria-familia
```

### 2️⃣ Backend (Python)
```bash
cd backend
python -m venv venv
source venv/bin/activate   # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```
Backend disponible en: `http://localhost:5000`

### 3️⃣ Frontend (React + Vite)
```bash
cd frontend
yarn install
yarn dev
```
Frontend disponible en: `http://localhost:5173`

---

## 🌐 Despliegue en línea
Accede a la versión desplegada aquí:  
👉 [https://recuerdos-familia.emergent.host/](https://recuerdos-familia.emergent.host/)  

---

## 🌟 Capturas (opcional)
> *(Agrega aquí screenshots de tu álbum digital, línea del tiempo y árbol genealógico cuando estén listos)*

---

## 👨‍👩‍👧‍👦 Autoría
Proyecto desarrollado como un **espacio digital seguro y privado** para preservar la memoria familiar.  

💡 *“Porque cada recuerdo merece un lugar especial.”*  

---

## 📜 Licencia
Este proyecto está bajo la licencia MIT.  
