# Usuarios y permisos

## Qué hace

Administra quién entra al sistema y qué puede hacer. Cada persona tiene un **rol**; el rol
determina sus permisos.

| Rol | Para quién |
|---|---|
| **Administrador** | El dueño. Todo, incluidos usuarios y permisos. |
| **Gerente** | Encargado. Cancela ventas, autoriza descuentos, hace retiros, ajusta inventario y configura. |
| **Farmacéutico** | Vende, gestiona productos y compras, consulta Kardex, caducidades y controlados. |
| **Cajero** | Vende, abre y cierra su turno y atiende clientes. |

## Cómo se usa

1. **Configuración › Usuarios** (o el acceso directo **Usuarios** del menú).
2. **Nuevo usuario**: nombre, apellido, usuario, correo, rol y contraseña (mínimo 8 caracteres).
3. Por persona puedes ver si tiene sesión abierta y desde cuándo, y:
   - **Editar** (incluido cambiar el rol o la contraseña).
   - **Cerrar sesiones**: saca a la persona de todos los dispositivos (útil si dejó la sesión
     abierta en otra caja).
   - **Dar de baja**: pierde el acceso al instante; su historial se conserva. Se puede
     **reactivar**.
4. **Configuración › Permisos**: tabla de qué puede hacer cada rol (sólo consulta).
5. Cada usuario cambia **su propia contraseña** desde su nombre (arriba a la derecha) →
   **Cambiar contraseña**. Al cambiarla, se cierran todas sus sesiones.

## Qué protege

- La sesión no puede ser robada por programas maliciosos en la página: las credenciales viajan
  en cookies que el navegador protege.
- Las pantallas y botones que una persona no puede usar ni siquiera aparecen; y aunque alguien lo
  intente, el servidor lo rechaza.
- No se puede eliminar al último administrador ni cambiarse el rol a uno mismo.
- Si la sesión caduca, el sistema avisa y pide entrar de nuevo; la venta en curso se recupera.

## Limitaciones

- Los permisos son por rol, no por persona: para dar más permisos a alguien hay que cambiar su
  rol.
- La matriz de permisos la define el sistema; no se edita desde la pantalla.

## Consejos de operación

- Una cuenta por persona: nunca compartan usuario. Así cada venta, descuento y apertura de cajón
  tiene responsable.
- Da de baja de inmediato a quien deje de trabajar en la farmacia.
- Cambia la contraseña del administrador inicial el primer día.
