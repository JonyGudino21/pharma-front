# Clientes y crédito

## Qué hace

Directorio de clientes (con RFC y domicilio para la nota de remisión), precios especiales,
crédito con límite, deudores, abonos y estado de cuenta.

## Cómo se usa

1. Menú **Clientes** → **Nuevo cliente**: nombre, correo, teléfono, domicilio, RFC y CURP.
2. **Estado de cuenta**: ventas del cliente con sus pagos, filtrable por fechas.
3. **Deudores**: lista de clientes con saldo; desde ahí se **configura el crédito** (activar y
   límite) y se **registra un abono** (efectivo, transferencia o tarjeta).
4. En el punto de venta, el cajero elige al cliente con **F4** y puede cobrar a crédito si tiene
   crédito disponible.

### Precios especiales

En el estado de cuenta de cada cliente ves sus precios especiales: el de lista, el suyo, la diferencia, y
quién lo cambió, cuándo y por qué. Desde ahí se agregan, cambian o quitan (gerencia).

## Qué protege

- No se vende a crédito por encima del límite autorizado.
- Cada abono queda registrado y reduce la deuda del cliente.
- Desactivar un cliente no borra su historial.

## Limitaciones

- Hoy la configuración de crédito sólo está disponible desde la lista de **Deudores**, es decir,
  para clientes que ya tienen saldo: a un cliente nuevo todavía no se le puede activar el crédito
  desde la pantalla antes de su primera compra.
- Los permisos (crear, editar, ver deudores, registrar abonos, configurar crédito) son
  independientes.

## Consejos de operación

- Captura RFC y domicilio de clientes empresariales: aparecen en la nota de remisión.
- Revisa Deudores cada semana y da seguimiento a los saldos vencidos.
- Imprime una nota de remisión en las ventas a crédito: muestra el saldo pendiente y tiene líneas
  de firma.
