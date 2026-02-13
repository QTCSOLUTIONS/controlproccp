# CONTROLPRO - Audit Systems.

Sistema de Control Interno y Auditoría con integración de IA.

## Requisitos
- Node.js & npm
- Cuenta de Supabase
- Cuenta de Google Gemini AI (Opcional)

## Configuración Local
1.  Clonar repositorio.
2.  `npm install`
3.  Configurar `.env.local`:
    ```
    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...
    VITE_GEMINI_API_KEY=...
    ```
4.  `npm run dev`

## Estructura del Proyecto (Actualizada)
- `/src`: Lógica principal, API y cliente Supabase.
- `/components`: Componentes UI (Renombrados a `*Comp.tsx` para compatibilidad Vercel).
- `App.tsx`: Punto de entrada principal.

## Despliegue en Vercel
1.  Conectar repositorio GitHub.
2.  Configurar variables de entorno en el panel de Vercel (Settings > Environment Variables).
3.  Desplegar.

*Última actualización: Corrección de rutas de importación y renombramiento de componentes.*
