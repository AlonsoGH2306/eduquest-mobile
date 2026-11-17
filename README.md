# EduQuest Mobile

Aplicación móvil de **EduQuest**, una plataforma colaborativa para estudiantes universitarios que reúne una biblioteca de apuntes por curso, grupos de estudio con chat y sala de voz, asesorías entre compañeros, un foro de preguntas y un planificador de estudio. Está hecha con React Native y Expo, y consume exclusivamente la API REST de [eduquest-backend](https://github.com/Juan-Hello-World/eduquest-backend).

**Curso:** CS2031 Desarrollo Basado en Plataformas · Proyecto 2

| Integrante | Código |
|---|---|
| Juan Pablo Saavedra Ruiz | 202510537 |
| Piero Alejandro Ortega Capacute | 202510580 |
| Omar Alonzo Guzmán Harvey | 202510519 |
| Edson Yenen Falcon Jimenez | 202510492 |

| Entorno | URL |
|---|---|
| API (AWS EC2 + RDS + S3) | https://3-222-104-57.sslip.io/api/v1 |
| Web (AWS Amplify) | https://main.d2uujuj0mby859.amplifyapp.com |

---

## Índice

1. [Tecnologías](#tecnologías)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Navegación y pantallas](#navegación-y-pantallas)
4. [Roles y permisos](#roles-y-permisos)
5. [Sensores y APIs externas](#sensores-y-apis-externas)
6. [Arquitectura](#arquitectura)
7. [Instalación y ejecución local](#instalación-y-ejecución-local)
8. [Deployment](#deployment)

---

## Tecnologías

| Área | Tecnología |
|---|---|
| Lenguaje | TypeScript |
| Framework | React Native 0.88 con Expo SDK 58 |
| Componentes de UI | React Native Paper (Material Design 3) con tema nocturno y modo claro |
| Navegación | React Navigation 7: Bottom Tabs y Native Stack con `ParamList` tipados |
| Iconos | Ionicons y Material Community Icons (`@expo/vector-icons`) |
| Tipografías | Unbounded y Figtree (`@expo-google-fonts`) |
| Cliente HTTP | Axios con instancia centralizada e interceptores |
| Tiempo real | WebSocket nativo contra `/ws` del backend |
| Almacenamiento seguro | `expo-secure-store` (Keychain en iOS, Keystore en Android) |
| Sensores y hardware | `expo-camera`, `expo-location`, `expo-sensors`, `expo-image-picker`, `expo-haptics` |
| Multimedia y archivos | `expo-video`, `expo-audio`, `expo-document-picker`, `expo-image-manipulator`, `react-native-svg` |
| Notificaciones | `expo-notifications` (recordatorios locales y push) |
| Conectividad | `@react-native-community/netinfo` |
| Build y distribución | EAS Build (`eas.json`) |

## Estructura del proyecto

```
eduquest-mobile/
├── App.tsx                    Punto de entrada: carga las fuentes y envuelve la app con los
│                              Context (tema, sesión, avisos) y la navegación
├── app.json                   Configuración de Expo, permisos y plugins
├── eas.json                   Perfiles de compilación (preview y production)
├── .env.example               Variables de entorno de ejemplo
├── assets/                    Ícono, splash y sonidos
└── src/
    ├── navigation/            Navegadores: pestañas inferiores, un stack de pantallas por pestaña
    │                          y el stack de inicio de sesión
    ├── screens/               Pantallas: solo UI y navegación; los datos llegan por custom hooks
    ├── components/            Componentes reutilizables: ScreenTitle, StateView, Skeleton, DocumentRow,
    │                          GroupRow, SessionCard, ChatThread, ConfirmDialog, Lumi, NightSky…
    ├── contexts/              AuthContext, ThemeContext, ToastContext, MyGroupsContext,
    │                          SavedDocumentsContext y NotificationsContext
    ├── hooks/                 Custom hooks de datos, sensores y formularios (usePaginatedList, useDocuments,
    │                          useGroupChat, useWeather, usePhoneOrientation, useFocusTimer, useForm…)
    ├── services/              api.ts, tokenStorage.ts, realtime.ts y un servicio por recurso de la API,
    │                          más weatherService.ts (Open-Meteo)
    ├── theme/                 Paleta, tipografía, radios y tema de React Native Paper
    ├── types/                 Interfaces de los DTOs y ParamList de la navegación
    └── utils/                 Validaciones, errores, fechas, enlaces, QR, recordatorios, vista previa
                               de archivos, fórmulas y texto enriquecido
```

## Navegación y pantallas

Sin sesión iniciada, la app muestra las pantallas de autenticación. Con sesión, muestra cinco pestañas en la parte inferior; cada pestaña tiene su propio stack, así que al abrir una pantalla se puede volver atrás sin perder la pestaña.

| Pestaña | Pantallas a las que se llega desde ella |
|---|---|
| Inicio | Inicio, notificaciones, mensajes, chats grupales, foro, calendario, modo enfoque, búsqueda y mensajes guardados |
| Biblioteca | Biblioteca, detalle de material y subir material |
| Grupos | Lista de grupos, detalle, chat, hilos, sesiones, reseñas, invitación, escanear QR, crear y personalizar grupo |
| Plan | Planificador de estudio |
| Perfil | Perfil, logros y administración |

### Autenticación

| Pantalla | Descripción |
|---|---|
| Login | Inicio de sesión con validación en tiempo real y acceso a la recuperación de contraseña |
| Registro | Creación de cuenta con confirmación de contraseña y opción de marcarse como asesor |
| Recuperar contraseña | Código de 6 dígitos enviado al correo y nueva contraseña |
| Cuenta suspendida | Motivo, fecha de fin y formulario de apelación |

### Inicio

| Pantalla | Descripción |
|---|---|
| Inicio | Saludo, accesos a los grupos del usuario con sus mensajes nuevos, clima de la zona con un consejo de estudio, puntos acumulados y últimos materiales subidos |
| Notificaciones | Avisos de actividad en los grupos, mensajes directos, insignias nuevas y comunicados; al tocar uno se abre la pantalla correspondiente |
| Mensajes | Conversaciones privadas y chats grupales de 3 a 10 personas, con contador de no leídos y conversaciones fijadas |
| Foro | Preguntas por curso, respuestas, votos y mejor respuesta, actualizados en tiempo real |
| Calendario | Asesorías de todos los grupos del usuario, por mes, con botón para añadirlas a Google Calendar |
| Modo enfoque | Pomodoro que arranca al poner el celular boca abajo |
| Búsqueda global | Materiales, grupos, preguntas del foro y personas |
| Mensajes guardados | Mensajes que el usuario guardó en sus grupos; al tocar uno se abre en su chat |

### Biblioteca

| Pantalla | Descripción |
|---|---|
| Biblioteca | Buscador, filtros por etiqueta, curso y universidad, y una pestaña con los materiales guardados. Los resultados se cargan por páginas a medida que se baja |
| Detalle de material | Ver el archivo sin salir de la app, guardarlo, reportarlo, dejar una reseña y practicar con un quiz o flashcards generados del material |
| Subir material | Subir un archivo del celular o pegar un enlace, con curso, universidad y etiquetas; también editar o eliminar un material propio |

### Grupos

| Pantalla | Descripción |
|---|---|
| Grupos | Dos vistas: los grupos del usuario, ordenados por actividad reciente, y un buscador de grupos por nombre o código. Desde aquí se crea un grupo o se escanea un QR |
| Detalle de grupo | Portada y foto del grupo, materiales, sesiones, integrantes conectados, sala de voz, sala de estudio con un Pomodoro que ven todos a la vez e invitación por QR o enlace |
| Chat del grupo | Canales, menciones, formato, reacciones, hilos, mensajes fijados, búsqueda, fotos, videos, documentos, encuestas y stickers |
| Sesiones | Agendar una asesoría, editarla, confirmar asistencia (con recordatorio en el celular), entrar a la reunión, calificarla al terminar y adjuntar su grabación de YouTube |
| Crear y personalizar grupo | Grupo público o privado con color, foto y portada |
| Invitación | Se abre desde un enlace o QR, muestra el grupo y permite unirse con un toque |

### Plan y Perfil

| Pantalla | Descripción |
|---|---|
| Plan de estudio | Planes por curso o por ciclo con checklist de actividades y barra de progreso |
| Perfil | Datos de la cuenta, estado (disponible, ocupado, ausente o invisible), nombre, foto, contraseña, perfil de asesor, tema claro u oscuro y sonido de inicio |
| Logros | Puntos, insignias y ranking semanal o histórico |
| Perfil público | Puntos, insignias y materiales de otra persona, con botones para seguir y escribirle |
| Administración | Gestión de usuarios, reportes, apelaciones y comunicados; solo aparece para gestores y administradores |

En los chats se mantiene presionado un mensaje para responder, editar o eliminar; los mensajes llegan en tiempo real y se ve quién está escribiendo.

## Roles y permisos

### Roles de la plataforma

| Acción | Estudiante | Gestor | Administrador |
|---|:---:|:---:|:---:|
| Biblioteca, grupos, chat, foro, planes y perfil | ✓ | ✓ | ✓ |
| Reportar materiales y usuarios | ✓ | ✓ | ✓ |
| Ver usuarios, reportes y apelaciones | | ✓ | ✓ |
| Suspender estudiantes (1, 3 o 7 días) y eliminar materiales reportados | | ✓ | ✓ |
| Cambiar roles, vetar y suspender gestores | | | ✓ |
| Enviar avisos a la comunidad | | | ✓ |

El rol llega con la sesión y se guarda en `AuthContext`. La pantalla de perfil solo muestra las opciones de administración permitidas para cada rol, y el backend vuelve a validar cada permiso.

### Roles dentro de un grupo

| Acción | Integrante | Moderador | Creador |
|---|:---:|:---:|:---:|
| Escribir, subir material, agendar y asistir a asesorías | ✓ | ✓ | ✓ |
| Crear, editar y borrar canales; fijar mensajes | | ✓ | ✓ |
| Configurar canales de anuncios, modo lento y palabras prohibidas | | ✓ | ✓ |
| Editar la foto, la portada y el color del grupo | | ✓ | ✓ |
| Quitar integrantes (los moderadores no pueden quitar al creador ni a otros moderadores) | | ✓ | ✓ |
| Nombrar moderadores, editar los datos y eliminar el grupo | | | ✓ |

## Sensores y APIs externas

| Recurso | Para qué se usa | Qué pasa si se niega el permiso o no está disponible |
|---|---|---|
| Cámara (`expo-camera`) | Escanear el QR de un grupo para unirse | Se puede escribir el código del grupo a mano o ir a los ajustes para dar el permiso |
| Cámara y galería (`expo-image-picker`) | Elegir o tomar la foto de perfil y la del grupo; antes de subirla se recorta y se reduce su tamaño con `expo-image-manipulator` | Se explica cómo activar el permiso |
| GPS (`expo-location`) | Saber la ciudad del usuario para mostrar su clima | Muestra el clima de Lima e indica que es una referencia |
| Acelerómetro (`expo-sensors`) | Detectar cuándo el celular está boca abajo para iniciar o pausar el modo enfoque | El temporizador se maneja con botones |
| Notificaciones (`expo-notifications`) | Recordatorio 30 minutos antes de una asesoría confirmada y notificaciones push | La asistencia se confirma igual, pero sin recordatorio |
| Vibración (`expo-haptics`) | Vibración corta al completar una acción | La acción funciona sin vibrar |
| **Open-Meteo** (API externa) | Clima actual de la ubicación, sin necesidad de API key | Muestra un aviso con botón para reintentar; el resto del inicio funciona igual |

Los mensajes que explican cada permiso al usuario están declarados en `app.json` para Android e iOS.

Integraciones adicionales:

- **Enlaces de invitación:** un enlace `eduquest://groups/CÓDIGO` abre la app directamente en la invitación al grupo. Si no hay sesión iniciada, la invitación se muestra después de iniciarla.
- **Google Calendar:** cada asesoría futura tiene un botón que abre Google Calendar con el evento ya completado (título, fecha, hora y enlace).

## Arquitectura

El código está separado en capas, de modo que cada pantalla solo se ocupa de mostrar datos:

1. **Pantalla** (`screens/`): dibuja la interfaz con componentes de `components/` y navega entre pantallas.
2. **Custom hook** (`hooks/`): pide los datos, guarda el estado de carga y de error y expone las acciones (guardar, borrar, recargar).
3. **Servicio** (`services/`): una función por endpoint del backend.
4. **Cliente HTTP** (`services/api.ts`): instancia única de Axios que envía las peticiones a la API.

Los datos que comparten varias pantallas (sesión, tema, avisos, grupos y materiales guardados) viven en `contexts/`.

- **Cliente HTTP:** `axios.create` toma la URL de la API de `EXPO_PUBLIC_API_URL`. Sus interceptores agregan el JWT a cada petición; si el token venció, piden uno nuevo con el refresh token y repiten la petición. Las consultas se reintentan hasta 2 veces si falla la red o el servidor responde 502, 503 o 504, y si la cuenta fue suspendida se abre la pantalla correspondiente.
- **Sesión:** el access token y el refresh token se guardan en `expo-secure-store`, cifrados por el sistema operativo.
- **Context:** cada Context se crea en tres pasos: `createContext`, un componente Provider que guarda el estado y un hook (`useAuth`, `useThemeMode`, `useToast`…) para leerlo desde cualquier pantalla.
- **Custom hooks:** por ejemplo, `useDocuments` devuelve `documents`, `isLoading`, `error`, `refresh`, `loadMore` y `retry`. Si el usuario sale de la pantalla antes de que llegue la respuesta, la petición se cancela con `AbortController`.
- **Tiempo real:** `services/realtime.ts` mantiene una conexión WebSocket abierta con el backend, por la que llegan al instante los mensajes del chat, los mensajes directos, quién está conectado y las novedades del foro.
- **Manejo de errores:** todas las llamadas usan `try/catch`. `utils/errors.ts` traduce 400, 401, 403, 404, 409 y 5xx a mensajes claros, y los errores de validación del backend se muestran junto a cada campo. Además hay un `ErrorBoundary` que evita que un error cierre la app, un aviso cuando no hay internet, siluetas de carga (skeletons), mensajes para listas vacías, botones de reintento y avisos breves de éxito o error (`Snackbar`).
- **Formularios:** validación en tiempo real con `useForm`, botones deshabilitados mientras se envía y confirmación antes de cualquier acción destructiva.
- **Listados:** `FlatList` pide los datos al backend por páginas, carga la siguiente al llegar al final y se actualiza al deslizar hacia abajo.

## Instalación y ejecución local

Requisitos: Node.js 20 o superior, la app **Expo Go** en el celular o un emulador Android, y el backend en ejecución.

```bash
cd eduquest-mobile
npm run setup               # instala dependencias y las alinea con la versión de Expo
cp .env.example .env        # en Windows: copy .env.example .env
npm start                   # escanear el QR con Expo Go o presionar "a" para el emulador
```

### Variables de entorno

| Variable | Descripción | Valores |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | URL base de la API; el WebSocket usa la misma dirección | `auto` en desarrollo o `https://3-222-104-57.sslip.io/api/v1` para el backend desplegado |

Con `auto`, la app se conecta al backend que corre en la misma PC que Expo:

- toma la IP de la PC que aparece al iniciar Expo (`exp://192.168.x.x:8081`) y usa el puerto 8080;
- funciona en el emulador y en un celular conectado al mismo WiFi que la PC;
- si se escribe `localhost` o `10.0.2.2`, también se reemplaza por esa IP.

Después de cambiar `.env` hay que reiniciar Expo con `npx expo start -c`.

### Scripts

| Comando | Descripción |
|---|---|
| `npm run setup` | Instala las dependencias y las alinea con Expo SDK 58 |
| `npm start` | Inicia el servidor de desarrollo de Expo y muestra el QR para abrir la app en Expo Go |
| `npm run android` | Abre la app en el emulador Android |
| `npm run typecheck` | Revisión de tipos con TypeScript |

## Deployment

La app se distribuye como un APK de Android generado con **EAS Build**, el servicio de compilación de Expo:

1. `eas build` sube el código a los servidores de Expo y compila el APK.
2. Al terminar, EAS entrega un enlace y un QR para descargarlo e instalarlo en cualquier Android.
3. La app instalada se conecta al backend desplegado en AWS (EC2, RDS y S3) por HTTPS, y al chat en tiempo real por WSS. No hay que configurar nada en el celular.

| Configuración | Valor |
|---|---|
| Proyecto en Expo | `alonsogh23equipo/eduquest-mobile` (vinculado en `app.json` con `extra.eas.projectId`) |
| Perfil `preview` | Genera un APK para instalar directamente en cualquier Android |
| Perfil `production` | Genera la versión para publicar en Google Play o App Store |
| URL de la API (en ambos perfiles) | `EXPO_PUBLIC_API_URL=https://3-222-104-57.sslip.io/api/v1` |
| Identificador de la app | `pe.edu.utec.eduquest` (Android e iOS) |

### Generar el APK

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Si la carpeta no es un repositorio git, EAS necesita que antes de compilar se ejecute `$env:EAS_NO_VCS=1` (PowerShell) o `export EAS_NO_VCS=1` (Mac o Linux).

Para una demostración rápida sin compilar, `npx expo start --tunnel` permite abrir la app en Expo Go desde cualquier red. En ese modo no llegan las notificaciones push, porque Expo Go no las recibe en Android; para probarlas hay que instalar el APK.
