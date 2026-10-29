# 🏭 GreenAir QC - Aplicación de Registro de Pruebas Técnicas (v1)
### Control de Calidad de Climatizadores y Recuperadores de Aire Industriales (GISER)

Aplicación web y móvil completa, moderna y optimizada para el registro de pruebas técnicas en banco de ensayo de climatizadores y recuperadores industriales.

---

## ✨ Novedades y Características de la Versión v1

### 1. 🏭 Desplegable Dinámico: "Tipo de Fabricante"
- Ubicado **antes del personal de operaciones** (Pre-montador, Montador, Electricista).
- Incluye como opción destacada y predeterminada **GISER** (Catarroja, Valencia), correspondiente a la placa real enviada.
- Permite seleccionar fabricantes existentes, **agregar nuevos fabricantes** con el botón `+ Añadir` y **eliminar** fabricantes obsoletos mediante el modal de gestión.
- Persistencia local automática en `LocalStorage`.
- Reflejado en la ficha técnica del PDF y en los mensajes automáticos de WhatsApp y Gmail.

### 2. 📷 Lectura Automática por Imagen (OCR / Visión de Etiqueta Real)
- Procesamiento de la etiqueta técnica real del equipo:
  - **Modelo:** `GSR26 15/20 H-M` (esquina superior izquierda).
  - **Fecha de Fabricación:** `27/10/2026` (parte superior central).
  - **Número de Serie:** `Nº 2209946` (esquina superior derecha).
  - **Fabricante Detectado:** `GISER`.
- **Botón "Foto Real GISER":** Carga y procesa directamente la imagen enviada de la etiqueta para validación instantánea.
- **Pre-procesamiento en Canvas:** Binarización y contraste adaptativo para placas reflectantes de aluminio.

### 3. 📋 Formulario de Ensayos Técnicos
- **Checkpoints Mandatorios:** Presostatos, Ventilador de Impulsión, Ventilador de Retorno, Temperatura de Impulsión y Temperatura de Retorno con interruptores táctiles y botón *"Marcar todos OK"*.
- **Componentes Opcionales:** Sonda de CO2 y Mando de Superficie con sub-checkboxes condicionales de funcionamiento correcto.
- **Personal de Operaciones:** Pre-montador, Montador y Electricista con gestión dinámica (`+ Añadir`, eliminar y guardar localmente).
- **Evidencia Fotográfica Obligatoria:** Mínimo 3 fotos en funcionamiento con compresión en Canvas a 1280px (~150KB) que previene bloqueos de memoria en Android.

### 4. 📄 Generación de Reporte PDF y Opciones de Compartir
- Botón principal de acción: **"Guardar Ficha y Generar PDF"**.
- Documento oficial con membrete, tabla de datos de la placa, fabricante, checkpoints, personal y fotos incrustadas.
- Nombrado automático con el número de serie: `2209946_Ficha_Pruebas.pdf`.
- Opciones directas: **Compartir Nativo Android** (WhatsApp, Gmail, Drive), **WhatsApp Directo**, **Gmail Directo** y **Descarga Local**.

---

## 📱 Cómo Probar en el Celular y Generar el APK v1

### Método A: Probar en el Teléfono Inmediatamente (Instalación PWA en 10 Segundos)
1. Inicia el servidor en tu computadora:
   ```bash
   agy-node server.js
   ```
2. Desde tu teléfono celular (conectado a la misma red Wi-Fi), abre Google Chrome y entra a la dirección IP local de tu PC:
   `http://192.168.1.97:3000` (o la IP que reporte la consola).
3. En el menú de 3 puntos de Chrome (⋮), toca **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.
4. ¡Listo! Se instalará en tu celular con ícono propio, pantalla completa y acceso nativo a cámara y fotos.

---

### Método B: Proyecto Nativo Android (`android/`) y Compilación de APK v1
La carpeta `android/` contiene el proyecto nativo Android listo para compilar con Android Studio o Gradle:
- `android/app/src/main/AndroidManifest.xml` (Permisos de cámara y almacenamiento configurados).
- `android/app/src/main/java/.../MainActivity.java` (WebView acelerado por hardware).
- `android/app/src/main/assets/public/` (Copia exacta de los archivos de la app).

#### Para compilar con Android Studio:
1. Abre **Android Studio**.
2. Selecciona **Open** y elige la carpeta:
   `C:\Users\GreenAir\.gemini\antigravity\scratch\climatizadores-qc-app\android`
3. Ve al menú superior: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. El archivo APK instalable se generará en:
   `android/app/build/outputs/apk/debug/app-debug.apk`.
5. Pásalo a tu celular por cable USB o WhatsApp e instálalo.

#### Para compilar con GitHub Actions (en la nube sin instalar nada):
Sube esta carpeta a tu cuenta de GitHub; el flujo `.github/workflows/build-apk.yml` compilará el archivo `GreenAir-QC-v1.apk` automáticamente en la pestaña **Actions**.
