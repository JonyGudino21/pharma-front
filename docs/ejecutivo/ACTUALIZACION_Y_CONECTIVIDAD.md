# Actualizaciones y conexión

## Qué hace

- **Vigila la conexión con el servidor** y avisa con un aviso rojo cuando no se puede trabajar.
- **Avisa cuando hay una versión nueva** del sistema y deja que el usuario decida cuándo
  actualizar.

## Aviso "Sin conexión con el servidor"

- El sistema revisa el servidor cada 20 segundos (cada 5 cuando hay problemas). Un fallo aislado
  no enciende el aviso: tienen que ser dos seguidos.
- Mientras aparece, **no se pueden registrar ventas ni cobros**; el botón Cobrar se desactiva.
- Lo que está en pantalla se conserva. No hay que cerrar ni recargar.
- Al volver la conexión aparece "Conexión con el servidor restablecida." y todo sigue normal.
- Si el aviso dice que el servidor no accede a su base de datos, el problema está en el servidor.

**Qué hacer**: anotar las ventas a mano, revisar red y servidor, pulsar **Reintentar** y avisar a
soporte si no se resuelve. Ver [GUIA_CAJERO.md](GUIA_CAJERO.md).

> Si el servidor está instalado en una computadora de la farmacia, el sistema funciona aunque no
> haya internet: lo que importa es que esa computadora esté encendida y conectada a la red local.

## Aviso "Hay una versión nueva"

- El sistema revisa cada 5 minutos si hay una actualización publicada.
- **Nunca se recarga solo.** Muestra el aviso con **Actualizar ahora** o **Más tarde** (vuelve en
  30 minutos).
- Mientras haya una venta en curso, un comprobante en pantalla, cambios sin guardar en
  Configuración o una compra a medio capturar, no deja actualizar y explica por qué.
- Si una pantalla ya no puede abrirse con la versión vieja, el aviso es urgente y no se puede
  posponer.

## Qué protege

- Que una actualización **no borre una venta a medio cobrar** ni un formulario sin guardar.
- Que nadie cobre "a ciegas" cuando el servidor no responde.
- Que los problemas de red se detecten de inmediato, no al final del día.

## Limitaciones

- No existe modo fuera de línea: sin servidor no se registran ventas.
- "Más tarde" sólo pospone 30 minutos.

## Consejos de operación

- Publica las actualizaciones fuera del horario de mayor venta; el aviso estará listo al abrir.
- Pide al personal actualizar entre clientes, no al final del turno.
- Si el aviso rojo aparece seguido, revisa la red local o el equipo servidor.
