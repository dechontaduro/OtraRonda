# OtraRondaApp - Documentación Técnica

## Resumen Ejecutivo
**OtraRonda** es una aplicación web diseñada para calcular la ingesta segura de bebidas alcohólicas y proyectar el nivel de alcohol en la sangre (BAC) a lo largo del tiempo. Permite a los usuarios establecer un objetivo máximo de BAC y genera un plan de consumo sugerido (cuándo tomar un trago) para mantenerse por debajo o en dicho límite. Además, simula la temperatura de la bebida a lo largo del tiempo.

## Arquitectura y Stack Tecnológico
La aplicación es una Single Page Application (SPA) construida con tecnologías web modernas:
- **Framework:** Vue 3 (Composition API, `<script setup>`)
- **Herramienta de Construcción (Bundler):** Vite
- **Enrutamiento:** Vue Router
- **Visualización de Datos:** ECharts (para la graficación interactiva de la ingesta y el BAC)
- **Gestor de Paquetes:** npm

## Estructura del Proyecto
El proyecto sigue una estructura modular estándar de Vue:

- `src/main.js`: Punto de entrada de la aplicación que inicializa Vue y el router.
- `src/App.vue`: Componente raíz que define el contenedor principal y el `RouterView`.
- `src/views/`: Contiene las vistas de nivel de página (ej. `HomeView.vue`, `AboutView.vue`).
- `src/components/`: Componentes reutilizables de la interfaz de usuario:
  - `ParametrosForm.vue`: Formulario lateral para ingresar los datos del usuario y la bebida.
  - `GraficoIngesta.vue`: Gráfico interactivo que muestra la curva de BAC y los momentos de ingesta usando ECharts.
  - `ResumenIngesta.vue`: Panel de resumen de resultados calculados.
- `src/services/`: Lógica de negocio pura.
  - `calculoIngesta.js`: Contiene el algoritmo principal de simulación y cálculo de BAC.
- `src/models/`: Estructuras de datos estáticas y configuraciones.
  - `opciones.js`: Define constantes como los niveles de BAC predefinidos, tipos y tamaños de bebidas.

## Lógica Principal (`calculoIngesta.js`)
El núcleo de la aplicación reside en el servicio `calcularPlanIngesta`. Esta función toma los parámetros del usuario y simula el proceso minuto a minuto:

### Algoritmo de Cálculo (Fórmula de Widmark Modificada)
El modelo se basa en la aproximación de Widmark, considerando:
- **Tasa de Eliminación:** Fija en 15 mg/100ml por hora (0.25 por minuto).
- **Factor de Widmark:** 0.68 para hombres ('M') y 0.55 para mujeres.
- **Absorción:** Considera un período de absorción diferida (por defecto 20 minutos), distribuyendo la ingesta de un trago durante ese rango de tiempo en lugar de un aumento instantáneo en la sangre.

### Mecánica de Simulación
1. **Bucle Minuto a Minuto:** Itera a lo largo del "tiempo total" especificado por el usuario.
2. **Absorción y Eliminación:** En cada minuto, descuenta la tasa metabólica y suma el alcohol que ha terminado de absorberse en ese lapso.
3. **Decisión Greedy de Ingesta:** Evalúa si el usuario puede tomar un trago. Se verifican dos condiciones principales (a menos que sea un trago forzado por el usuario):
   - Ha pasado el tiempo mínimo entre tragos.
   - Si se toma el trago ahora, la suma del BAC actual más el BAC pendiente de absorción y el BAC aportado por el nuevo trago no superará el `targetBAC`.
4. **Simulación Térmica:** Modela cómo se calienta la bebida restante a una tasa `deltaTemp` por minuto, hasta llegar a `tempFinal`.
5. **Eventos Interactivos:** Soporta la inyección de `tragosFijos` (momentos específicos en los que el usuario decide tomar un trago manualmente a través de la interfaz gráfica), omitiendo la lógica predictiva (Greedy) para esos instantes anteriores.

## Interacción de la Interfaz (`HomeView.vue`)
El flujo de datos principal se orquesta en `HomeView.vue`:
1. El usuario introduce datos en `ParametrosForm`.
2. Al pulsar calcular, se dispara un evento que llama a `reiniciarSimulacion()`.
3. Se invoca a `calcularPlanIngesta()` para generar el primer arreglo con la `datosSimulacion`.
4. Esta información fluye reactivamente a `GraficoIngesta` y `ResumenIngesta`.
5. **Interactividad:** El gráfico ECharts permite arrastrar puntos (los instantes de consumo). Al hacerlo, se emite un evento `tragoMovido` a `HomeView`, el cual actualiza el estado de `tragosFijos` y recomputa toda la simulación a partir de esa interacción manual.

## Opciones y Modelos (`opciones.js`)
Centraliza los catálogos utilizados en los formularios:
- **Niveles de BAC:** Desde 20 mg/100ml hasta 100 mg/100ml.
- **Tipos de Bebidas:** Cervezas (4-5%), Vinos (12%), Destilados (40%).
- **Tamaños Comunes:** Desde 30cc (shot) hasta 1000cc (litro).
