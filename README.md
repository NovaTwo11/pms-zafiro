### 2. Frontend: `pms-zafiro`
Este README se enfoca en la **Experiencia de Usuario (UX)**, el uso de componentes modernos (Shadcn) y la gestión de estado compleja necesaria para un dashboard administrativo.

```markdown
# Zafiro PMS - Frontend Client

Interfaz de usuario moderna y reactiva para el sistema de gestión hotelera Zafiro. Construida con **Next.js 16 (App Router)** y **React 19**, enfocada en ofrecer una experiencia de usuario fluida, accesible y rica en datos para administradores y recepcionistas.

## 💻 Tecnologías y Stack

* **Framework:** Next.js 16 (App Router) & React 19
* **Lenguaje:** TypeScript
* **Estilos:** Tailwind CSS
* **UI Components:** Shadcn UI (basado en Radix UI)
* **Estado & Data Fetching:** Zustand & TanStack Query (React Query)
* **Gráficos:** Recharts (para reportes de ingresos y ocupación)
* **Formularios:** React Hook Form + Zod (Validación de esquemas)

## 🎨 Módulos y Características

* **Dashboard Interactivo:**
    * Visualización de KPIs en tiempo real.
    * Gráficos de ingresos, ocupación y demografía de huéspedes.
    * Feed de actividades recientes.
* **Calendario / Cronograma:** Vista visual de ocupación de habitaciones y gestión de reservas "Drag & Drop".
* **Gestión de Operaciones:**
    * **Huéspedes:** Base de datos de clientes e historial.
    * **Habitaciones:** Estado de limpieza y mantenimiento.
    * **Inventario:** Gestión de productos y servicios.
* **Punto de Venta (POS):** Interfaz para cajeros, ventas rápidas y cierre de turnos.
* **Guest Check-in Wizard:** Flujo dedicado para que los huéspedes realicen su pre-checkin online mediante código de reserva.
* **Configuración:** Gestión de tarifas, usuarios y parámetros del hotel.

## 📸 Capturas de Pantalla

*(Aquí te recomiendo subir un par de imágenes de tu carpeta /public o capturas de pantalla a tu repo y linkearlas)*
* *Dashboard Principal*
* *Vista de Cronograma*
* *Wizard de Check-in*

## 🚀 Configuración Local

### Prerrequisitos
* Node.js 18+ (Recomendado 20 LTS o superior)
* npm o pnpm

### Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/pms-zafiro.git](https://github.com/tu-usuario/pms-zafiro.git)
    cd pms-zafiro
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    # o si usas pnpm
    pnpm install
    ```

3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env.local` en la raíz:
    ```env
    NEXT_PUBLIC_API_URL=https://localhost:7062/api
    ```

4.  **Iniciar servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Scripts Disponibles

* `npm run dev`: Inicia el entorno de desarrollo.
* `npm run build`: Compila la aplicación para producción.
* `npm run start`: Inicia el servidor de producción.
* `npm run lint`: Ejecuta el linter para asegurar calidad de código.
