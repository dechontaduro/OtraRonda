<template>
  <div class="resumen-container">
    <div class="stats-grid">
      <div class="stat-card info">
        <h4>Tiempo a objetivo</h4>
        <p class="valor">{{ metricasRitmo.carga }} <small>min</small></p>
        <span class="detalle">Desde el primer trago</span>
      </div>

      <div class="stat-card info">
        <h4>Ritmo Mantenimiento</h4>
        <p class="valor">
          <template v-if="metricasRitmo.mantenimiento > 0">
            {{ metricasRitmo.mantenimiento }} <small>min</small>
          </template>
          <template v-else>
            --
          </template>
        </p>
        <span class="detalle">Tiempo entre tragos post-carga</span>
      </div>

      <div class="stat-card">
        <h4>Total Bebidas</h4>
        <p class="valor">{{ totalTragos }}/{{ totalBebidas }}</p>
        <span class="detalle">Tragos/Unidades destapadas</span>
      </div>
      
      <div class="stat-card">
        <h4>Volumen Ingerido</h4>
        <p class="valor">{{ volumenTotal }} <small>cc</small></p>
        <span class="detalle">Total de líquido</span>
      </div>

      <div class="stat-card highlight">
        <h4>Pico Máximo BAC</h4>
        <p class="valor">{{ maxBAC.toFixed(1) }} <small>mg</small></p>
        <span class="detalle">Nivel máximo alcanzado</span>
      </div>

      <div class="stat-card warning">
        <h4>Tiempo para Sobriedad</h4>
        <p class="valor">{{ horasSobriedad.toFixed(1) }} <small>hrs</small></p>
        <span class="detalle">Desde el final de la sesión</span>
      </div>

      
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  datosSimulacion: { type: Array, required: true },
  parametros: { type: Object, required: true }
});

const totalTragos = computed(() => {
  if (!props.datosSimulacion.length) return 0;
  return props.datosSimulacion[props.datosSimulacion.length - 1].numeroTrago;
});

const totalBebidas = computed(() => {
  if (!props.datosSimulacion.length) return 0;
  return props.datosSimulacion[props.datosSimulacion.length - 1].numeroBebida;
});

const volumenTotal = computed(() => {
  if (!props.datosSimulacion.length) return 0;
  return totalTragos.value * props.parametros.volumenTrago;
});

const maxBAC = computed(() => {
  if (!props.datosSimulacion.length) return 0;
  return Math.max(...props.datosSimulacion.map(d => d.bac));
});

const horasSobriedad = computed(() => {
  if (!props.datosSimulacion.length) return 0;
  const factorWidmark = props.parametros.sexo === 'M' ? 0.68 : 0.55;
  const bacPorTrago = ((props.parametros.volumenTrago * (props.parametros.porcentajeAlcohol / 100) * 0.789) / (props.parametros.pesoKg * factorWidmark)) * 100;
  
  const bacTotalIngresado = totalTragos.value * bacPorTrago;
  const bacMetabolizado = props.parametros.tiempoTotalMin * (15 / 60); 
  const bacRestante = Math.max(0, bacTotalIngresado - bacMetabolizado);
  
  return bacRestante / 15;
});

// Nueva propiedad computada basada en el objetivo de BAC
const metricasRitmo = computed(() => {
  if (!props.datosSimulacion.length) return { carga: 0, mantenimiento: 0 };
  
  const tragos = props.datosSimulacion.filter(d => d.tomarTrago);
  if (tragos.length < 2) return { carga: 0, mantenimiento: 0 };

  // 1. Definir el umbral de éxito (95% de la meta o del pico máximo si no llega a la meta)
  const maxBacAlcanzado = Math.max(...props.datosSimulacion.map(d => d.bac));
  const umbralMeta = Math.min(props.parametros.targetBAC, maxBacAlcanzado) * 0.95;

  // 2. Encontrar en qué minuto el cuerpo realmente alcanzó ese umbral
  const minutoAlcanzaMeta = props.datosSimulacion.find(d => d.bac >= umbralMeta)?.minuto || props.parametros.tiempoTotalMin;

  // 3. Separar los tragos usando tu lógica
  const tragosCarga = tragos.filter(t => t.minuto <= minutoAlcanzaMeta);
  const tragosMantenimiento = tragos.filter(t => t.minuto > minutoAlcanzaMeta);

  // El final de la fase de carga es el minuto del último trago tomado para llegar ahí
  const finFaseCargaMinuto = tragosCarga.length > 0 ? tragosCarga[tragosCarga.length - 1].minuto : 0;

  // 4. Calcular el ritmo de la fase de mantenimiento
  let promedioMantenimiento = 0;
  
  if (tragosMantenimiento.length >= 2) {
    let sumaDiferencias = 0;
    for (let i = 1; i < tragosMantenimiento.length; i++) {
      sumaDiferencias += (tragosMantenimiento[i].minuto - tragosMantenimiento[i - 1].minuto);
    }
    promedioMantenimiento = sumaDiferencias / (tragosMantenimiento.length - 1);
  } else if (tragosMantenimiento.length === 1 && tragosCarga.length > 0) {
    // Si solo hay un trago de mantenimiento, calculamos el tiempo desde que terminó la carga
    promedioMantenimiento = tragosMantenimiento[0].minuto - finFaseCargaMinuto;
  }

  return {
    carga: finFaseCargaMinuto,
    mantenimiento: Math.round(promedioMantenimiento)
  };
});
</script>

<style scoped>
/* Estilos anteriores mantenidos... */
.resumen-container { margin-top: 25px; padding-top: 20px; border-top: 2px dashed #e0e0e0; }
h3 { color: #333; margin-bottom: 15px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; }
.stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
.stat-card.highlight { background: #e3f2fd; border-color: #bbdefb; }
.stat-card.warning { background: #fff3e0; border-color: #ffe0b2; }
.stat-card.info { background: #f4f6f8; border-color: #d8e2ef; } /* Nuevo estilo para las métricas de ritmo */
h4 { margin: 0 0 10px 0; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
.valor { font-size: 28px; font-weight: bold; color: #2c3e50; margin: 0; }
.valor small { font-size: 16px; color: #7f8c8d; }
.detalle { display: block; font-size: 12px; color: #95a5a6; margin-top: 5px; }
</style>