# Kando - Gestor de Tareas Kanban

Kando es una aplicación web moderna de gestión de tareas basada en la metodología Kanban. Permite a usuarios y administradores organizar, priorizar y rastrear tareas en un tablero intuitivo con funcionalidad de arrastrar y soltar.

## Descripción del Proyecto

Kando es una solución completa para la gestión colaborativa de proyectos y tareas. El sistema está diseñado para ser flexible y escalable, permitiendo tanto gestión personal como trabajo en equipo con diferentes niveles de permisos.

Características principales:

- Autenticación segura con JWT
- Gestión de tareas con estados personalizables
- Sistema de roles (Admin, Usuario, Invitado)
- Tablero Kanban interactivo con drag-and-drop
- Sistema de etiquetas para categorización
- Asignación de tareas a usuarios
- Modo invitado para explorar sin registrarse
- Interfaz responsiva y accesible

## Stack Tecnológico

- Angular 21 (Standalone Components)
- Supabase (Backend y autenticación)
- TypeScript
- SCSS para estilos
- Angular Material (iconografía)
- Angular CDK (funcionalidad drag-drop)
- Signals para reactividad moderna

## Requisitos Previos

Asegúrate de tener instalados:

- Node.js v18 o superior
- npm v9 o superior
- Angular CLI v21

Para instalar Angular CLI globalmente:

```bash
npm install -g @angular/cli@21
```

## Instalación

1. Clonar el repositorio

```bash
git clone <repository-url>
cd Kando
```

2. Instalar dependencias

```bash
npm install
```

3. Configurar variables de entorno

Las variables de Supabase se gestionan a través de archivos de entorno:

**Para desarrollo local:** `src/environments/environment.ts`
**Para producción:** `src/environments/environment.prod.ts`

```typescript
export const environment = {
    production: false,
    supabase: {
        url: 'https://imawpbvponmtvaeemkms.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...'
    }
};
```

El proyecto automáticamente selecciona el archivo correcto:
- `ng serve` → usa `environment.ts` (desarrollo)
- `ng build --configuration production` → usa `environment.prod.ts` (producción)

## Variables de Entorno Requeridas

Las siguientes variables se definen en los archivos de `src/environments/`:

| Variable | Descripción | Ubicación |
|----------|-------------|-----------|
| supabase.url | URL del proyecto Supabase | `environment.ts` |
| supabase.anonKey | Clave anónima de Supabase | `environment.ts` |

Para referencia, ver `.env.example` con plantilla de variables.

## Ejecución

Iniciar el servidor de desarrollo:

```bash
npm start
```

O usando Angular CLI directamente:

```bash
ng serve
```

La aplicación estará disponible en `http://localhost:4200/`

## Credenciales de Prueba

Para probar la aplicación, usa las siguientes cuentas:

Cuenta Administrador

- Email: admin@admin.es
- Contraseña: admin1234

Cuenta Usuario Regular

- Email: user@user.com
- Contraseña: user1234

Modo Invitado

- Acceso público sin registro
- Permisos de lectura únicamente
- Acceso a mover tarjetas y probar funcionalidades (todos los cambios hecho como invitado no se guardarán)
- Sesión temporal (no persiste después de cerrar la pestaña)
- Ideal para explorar la aplicación sin compromisos

## Arquitectura del Proyecto

```
src/
├── app/
│   ├── .env/
│   │   └── Ctes.ts                 # Importa variables desde environment.ts
│   ├── core/
│   │   ├── guards/                 # Guardias de rutas (auth, role)
│   │   ├── interceptors/           # HTTP interceptors
│   │   ├── models/                 # Modelos de datos
│   │   └── services/               # Servicios (auth, tasks, supabase)
│   ├── features/
│   │   ├── admin/                  # Módulo administración
│   │   ├── auth/                   # Login y registro
│   │   ├── dashboard/              # Tablero Kanban
│   │   ├── home/                   # Página pública
│   │   ├── not-found/              # Página 404
│   │   └── tasks/                  # Módulo de tareas
│   ├── shared/
│   │   ├── components/             # Componentes reutilizables (navbar, footer)
│   │   └── ui/                     # Componentes UI compartidos
│   ├── app.config.ts               # Configuración de la app
│   ├── app.routes.ts               # Configuración de rutas
│   ├── app.ts                      # Componente raíz
│   └── app.scss                    # Estilos globales
├── environments/
│   ├── environment.ts              # Variables de desarrollo
│   └── environment.prod.ts         # Variables de producción
├── styles.scss                     # Estilos principales
└── main.ts                         # Punto de entrada
```

## Estructura de Base de Datos

El proyecto utiliza Supabase con las siguientes tablas:

Tablas principales:

- profiles: Perfiles de usuarios (id, email, username, role)
- boards: Tableros Kanban (id, title, user_id)
- columns: Columnas del tablero (id, title, status, board_id)
- tasks: Tareas (id, title, tag, column_id, user_id, created_at)

## Desarrollo

Compilar el proyecto:

```bash
ng build
```

Los artefactos de compilación se almacenarán en el directorio `dist/`

Ejecutar pruebas unitarias:

```bash
ng test
```

Ejecutar pruebas end-to-end:

```bash
ng e2e
```

## Autenticación y Seguridad

Kando implementa un sistema de autenticación robusto:

- Autenticación con JWT via Supabase
- Tokens almacenados en localStorage (usuarios autenticados)
- SessionStorage para sesiones invitadas temporales
- Guards de rutas para proteger recursos
- Role-based access control (RBAC)
- AuthInterceptor para auto-adjuntar tokens en requests HTTP

## Roles y Permisos

Admin

- Crear, editar y eliminar tareas
- Gestionar usuarios
- Crear y editar columnas del tablero
- Modificar configuración

Usuario Regular

- Crear y editar sus propias tareas
- Ver todas las tareas
- No puede eliminar tareas de otros usuarios

Invitado

- Ver-solo para tareas y tableros
- No puede crear, editar o eliminar
- Sesión temporal

## Rutas Principales

- `/` - Página de inicio pública
- `/login` - Ingreso de usuarios
- `/register` - Registro de nuevos usuarios
- `/dashboard` - Tablero Kanban principal (protegido)
- `/tasks` - Listado de tareas (protegido)
- `/tasks/:id` - Detalle de tarea (protegido)
- `/tasks/create` - Crear nueva tarea (admin)
- `/tasks/:id/edit` - Editar tarea (admin)
- `/admin/users` - Gestión de usuarios (admin)

## Características Destacadas

Sistema de Autenticación Flexible

Autenticación con correo y contraseña, con opción de acceso temporal como invitado.

Tablero Kanban Interactivo

Interfaz drag-and-drop para mover tareas entre estados.

Sistema de Roles

Control granular de permisos basado en roles de usuario.

Modo Invitado

Permite explorar la aplicación sin necesidad de registro.

Interfaz Responsiva

Diseño adaptable a dispositivos desktop, tablet y móvil.

## Problemas Comunes

Error de conexión a Supabase

Verifica que las credenciales de Supabase sean correctas en `src/environments/environment.ts` y `src/environments/environment.prod.ts`

Puerto 4200 en uso

Detén procesos Node.js o cambia el puerto con: `ng serve --port 4300`

Módulos no encontrados

Asegúrate de instalar todas las dependencias: `npm install`

Modo invitado no funciona correctamente
- Si al cambiar de invitado a un usuario o admin hay una probabilidad de que la etiqueta de invitado siga haz F5 o refresca la página.
- Si estas como usuario o admin y pasas a invitado hay una probabilidad de que el invitado tenga la interfaz de admin.
- Si nada funciona limpia el sessionStorage: Abre DevTools (F12) y ejecuta `sessionStorage.clear()`

## Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.

## Licencia

Este proyecto está protegido bajo licencia privada.

---

Última actualización: Febrero 2026
