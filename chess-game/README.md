# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deployment & testing

Pasos rápidos para ejecutar y probar localmente, en la LAN y en producción.

- Local (desarrollo):

```bash
# Backend
cd ../mati-chess-backend
npm install
npm start

# Frontend
cd ../chess-game
npm install
npm run dev -- --host
```

- Probar desde el móvil en la misma LAN:

1. Obtén la IP de tu máquina (ej. `192.168.1.46`).
2. Lanza el backend y frontend como arriba.
3. En el móvil abre la URL de Vite (ej. `http://192.168.1.46:5174/`).
4. En `chess-game/.env` añade:

```
VITE_SOCKET_URL=http://192.168.1.46:3001
```

> Si tienes el frontend desplegado, también puedes usar el mismo `VITE_SOCKET_URL` en el dashboard de Vercel para que la app apunte al backend de tu red local o al backend público.

- Deploy en Render (backend) - recomendado para Socket.IO:

1. Conecta tu repositorio en Render.
2. Define el servicio apuntando al folder `mati-chess-backend`.
3. Comando de inicio: `node server.js` (Render asigna `PORT` automáticamente).
4. Usa el archivo `render.yaml` ya incluido en la raíz del repo para un deployment automático.
5. Después de desplegar, copia la URL pública del backend y configúrala en el frontend.

> Importante: Vercel no es un hosting fiable para Socket.IO persistente. El frontend sí puede desplegar en Vercel, pero el backend de Socket.IO debe ir a Render, un VPS o un servidor que soporte conexiones WebSocket/polling de largo plazo.

- Deploy en Vercel (frontend):

1. Crea un proyecto en Vercel usando este repo.
2. Durante la creación elige el subdirectorio `chess-game` como raíz del proyecto.
3. Añade la variable de entorno `VITE_SOCKET_URL` con la URL pública del backend (ej. `https://mi-backend.onrender.com`).
4. Build command: `npm run build`. Output: `dist`.

## Enlaces de demo producida

- Frontend: https://chess-game-six-pi.vercel.app
- Backend de Socket.IO: despliega en Render o en tu red local y configura `VITE_SOCKET_URL`.

Si querés, puedo ayudarte a crear las apps en Render y Vercel (necesitaré que concedas acceso, o que me indiques las URLs y credenciales necesarias).
