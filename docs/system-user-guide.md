# Guía de uso operativo de MiHato

Esta guía está escrita para los usuarios que operan la finca: describe qué hace cada módulo, qué pasos seguir para avanzar y cómo interpretar los números que aparecen en pantalla. No incluye instrucciones técnicas, solo flujos operativos y lo que tú ves como operador.

## Navegación principal

- **Menú lateral fijo**: Siempre visible apunta a los módulos (Dashboard, Inventario, Pesajes, Suplementación, Sanidad, Proyecciones y Utilidad). Puedes colapsarlo para ganar espacio, pero los botones permanecen accesibles.
- **Área principal con scroll**: Todo el contenido (tablas, formularios, tarjetas) corre en la columna derecha. El menú y el header permanecen fijos, así sabes siempre dónde estás.
- **Mensajes de estado**: Cada acción importante genera un mensaje emergente en la esquina superior derecha. Los mensajes verdes indican éxito, los rojos muestran fallos o validaciones pendientes.

## 1. Dashboard

- **Qué ves**: Resumen de animales activos, ventas recientes, eventos sanitarios y alertas importantes.
- **Alertas**: Si hay retiros sanitarios activos o insumos/medicamentos con stock bajo, aparecen tarjetas con colores para que las atiendas primero.
- **Para qué sirve**: Confirmar visualmente que los procesos clave (inventario, ventas, salud) están dentro de parámetros esperados antes de seguir con tareas específicas.

## 2. Inventario

- **Lotes**:
  1. Verás una lista de lotes creada automáticamente. Cada fila muestra nombre, descripción, capacidad y notas.
  2. Crea un lote con el botón “Nuevo lote”, completa nombre obligatorio y opcionales, y confirma. El sistema no permite nombres duplicados; si ocurre, te avisa con un mensaje rojo.
  3. Para editar, abre el mismo formulario con los valores actuales.
  4. Al eliminar, el sistema te lo recuerda: no puede borrarse un lote con animales asignados ni con historia sin ID.
- **Animales**:
  1. El formulario pide DIIO, género, fecha de ingreso, peso, precio por kilogramo y lote. Campos como transporte, comisión y procedencia son opcionales para tu registro.
  2. Si dejas un campo obligatorio vacío o el DIIO ya existe, el sistema te lo indica antes de guardar.
  3. Al guardar, calcula el precio total sumando transporte/comisión y confirma con un mensaje de éxito que incluye el DIIO y el lote.
- **Movimiento entre lotes**:
  1. Selecciona animales y abre “Cambiar lote”. Indica el lote de destino, la fecha y el motivo.
  2. Solo puedes continuar si defines el destino; de lo contrario el sistema muestra un aviso rojo.
  3. Al ejecutar, se notifica cuántos animales se movieron a qué lote.

## 3. Pesajes y desempeño

- **Gráficos y tarjetas**: Presentan GDP promedio por lote y raza, estadísticas de animales con tendencia alcista/declinante y listados con filtros (por animal, lote, peso actual, GDP, ración).
- **Registrar pesaje**:
  1. Selecciona animal, fecha y peso. También puedes indicar la ración habitual.
  2. El sistema exige los tres datos y te muestra un mensaje si falta alguno.
  3. Al guardar, el número se agrega a la lista histórica y se alerta con un toast indicando el animal medido.
- **Alertas de desempeño**: Si un animal pierde peso o lleva más de 30 días sin ganancia, aparece un chip informativo en la parte superior para revisar con el equipo.

## 4. Suplementación

- **Insumos**:
  1. Cada insumo muestra stock, precio y consumo estimado semanal.
  2. Al agregar uno nuevo indicas nombre, precio, costo/kg, stock y unidad. Los campos obligatorios son nombre, precio, costo y stock.
  3. Al guardar, el sistema notifica que el insumo ya forma parte del inventario.
- **Raciones**:
  1. Cada ración contiene nombre, lote, fecha de inicio/finalización y lista de insumos con dosis por animal.
  2. Para crear o editar, indica nombre, lote y agrega uno o varios insumos con dosis. Si falta nombre, lote o dosis la interfaz te lo recuerda y no deja continuar.
  3. Puedes activar o pausar una ración con un botón; al cambiar su estado, aparece un mensaje que explica si quedó activa, pausada por stock o finalizada.
- **Consumo automático**:
  1. Cada hora el sistema revisa las raciones activas, calcula cuánto se consumiría (dosis por animal × animales del lote × días transcurridos) y descuenta esa cantidad del stock de insumo.
  2. Este rebajo automático mantiene el inventario actualizado sin intervención manual y dispara alertas si un insumo se agota pronto, para que planifiques reposición.
  3. También puedes registrar consumos de forma manual: seleccionas la ración, indicas días aplicados, y el sistema rebaja el stock proporcionalmente.

## 5. Sanidad

- **Eventos sanitarios**:
  1. Registra vacunas, desparasitaciones, antibióticos o cirugías. Selecciona aplicar a un animal o a todo un lote, define fecha, producto, dosis y vía. También puedes poner diagnóstico, observaciones y días de retiro.
  2. Los campos obligatorios (fecha, producto, dosis y selección de animal o lote según corresponda) deben estar completos antes de guardar.
  3. Al guardar, el sistema calcula la fecha final del retiro y la muestra en las listas.
- **Alertas**: Si hay retiros vigentes, aparecen tarjetas destacadas con la duración y el producto activo. También se muestran medicamentos con stock bajo.

## 6. Proyecciones y escenarios

- **Escenarios**:
  1. Para crear un escenario debes indicar nombre, peso inicial, peso objetivo, GDP esperado, costo diario y precio de venta por kilo. Cada campo es obligatorio.
  2. El sistema calcula automáticamente los días necesarios para llegar al peso objetivo (kg faltantes ÷ GDP esperado) y el costo total multiplicando esos días por el costo diario.
  3. La utilidad se estima restando ese costo total (más un costo fijo asociado al peso inicial) del ingreso proyectado (peso objetivo × precio de venta). El ROI se presenta como porcentaje comparando la utilidad con la inversión estimada.
  4. Las tarjetas muestran estos valores para que compares escenarios rápidamente.
- **Matriz de sensibilidad**: Cambia los valores de GDP y costo diario para ver cómo varía la utilidad; el sistema recalcula automáticamente por ti.

## 7. Utilidad y salida de animales

- **Indicadores financieros**:
  1. Ingresos netos: suma de las ventas, descontando la merma indicada en cada salida.
  2. Costos totales: incluyen compra (precio total del animal), alimentación estimada, sanidad (eventos vinculados) y costos de salida.
  3. Utilidad neta: ingresos menos costos.
  4. Margen promedio: utilidad dividida por costos, expresado en porcentaje.
- **Registrar salidas**:
  1. Selecciona animal, define fecha, elige tipo de salida (venta o muerte) y completa los campos requeridos.
  2. Para ventas necesitas peso, precio/kg, canal de venta, costos de salida y merma (%). Para muertes solo se solicita causa.
  3. Si el animal tiene un retiro sanitario activo, el sistema no permite registrar la salida y alerta con un mensaje.
  4. Al guardar, el sistema confirma si fue una venta o muerte y lo agrega al historial.

## Consejos rápidos

- Siempre presta atención a los mensajes rojos: te dicen qué campo falta o qué restricción se debe resolver.
- Las alertas de stock o retiros aparecen sin que tú las busques. Usa esos avisos para dar prioridad a las compras y tratamientos.
- Si modificas un lote o animal, los cambios se reflejan de inmediato en las tablas para que tu equipo vea el estado actualizado.

## Qué hacer cuando algo falla

- Revisa los campos obligatorios y asegúrate de que no hay duplicados de DIIO o nombre de lote. El sistema te dirá exactamente qué repetir o corregir.
- Si aparece una alerta de retiro, continúa con otras tareas y vuelve más tarde; las salidas y ventas quedan bloqueadas hasta que el retiro expira.

MiHato sigue flujos naturales: registras inventario, controlas pesajes, aseguras la suplementación y sanidad, proyectas resultados y cierras con decisiones financieras. Sigue el orden lógico del menú y deja que los mensajes del sistema te guíen en cada paso.
