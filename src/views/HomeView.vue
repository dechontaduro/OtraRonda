<template>
    <div class="layout">
      <aside class="sidebar">
        <ParametrosForm @calcular="reiniciarSimulacion" />
        <div class="manual-controls">
          <hr />
          <h3>Modo en tiempo real</h3>
          <button class="btn-manual" @click="tomarTragoManual">🍺 Tomar trago ahora</button>
          <p v-if="modoManual" class="status-manual">
            Modo manual activo.<br>
            Minuto actual: <strong>{{ minutoActualManual }}</strong><br>
            Tragos tomados: <strong>{{ tragosManuales.length }}</strong>
          </p>
        </div>
      </aside>
      <main class="content">
        <template v-if="datosSimulacion.length > 0">
          
          <ResumenIngesta 
          :datosSimulacion="datosSimulacion" 
          :parametros="parametrosActuales" 
          />
          
          <GraficoIngesta 
          :datosSimulacion="datosSimulacion" 
          :parametros="parametrosActuales"
          />
        </template>

        <div v-else class="empty-state">
          Presiona "Calcular Ingesta" para generar la proyección.
        </div>
      </main>
    </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import ParametrosForm from '../components/ParametrosForm.vue';
import GraficoIngesta from '../components/GraficoIngesta.vue';
import ResumenIngesta from '../components/ResumenIngesta.vue';
import { calcularPlanIngesta } from '../services/calculoIngesta.js';

const datosSimulacion = ref([]);
const parametrosActuales = ref({});
const tragosFijos = ref([]); 

// Estado para el modo manual
const modoManual = ref(false);
const startTimeManual = ref(null);
const tragosManuales = ref([]);
const minutoActualManual = ref(0);
let intervalId = null;

const reiniciarSimulacion = (params) => {
  modoManual.value = false;
  if (intervalId) clearInterval(intervalId);
  
  parametrosActuales.value = { ...params };
  tragosFijos.value = []; 
  
  datosSimulacion.value = calcularPlanIngesta(params, [], false);
  
  tragosFijos.value = datosSimulacion.value
                        .filter(d => d.tomarTrago)
                        .map(d => d.minuto);
};

const tomarTragoManual = () => {
  if (Object.keys(parametrosActuales.value).length === 0) {
    alert("Por favor, configura tus parámetros y presiona 'Calcular Ingesta' primero.");
    return;
  }

  if (!modoManual.value) {
    modoManual.value = true;
    startTimeManual.value = Date.now();
    tragosManuales.value = [0];
    
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
        minutoActualManual.value = Math.floor((Date.now() - startTimeManual.value) / 60000);
    }, 1000); // Actualizar cada segundo para feedback visual rápido
  } else {
    const transcurrido = Math.floor((Date.now() - startTimeManual.value) / 60000);
    tragosManuales.value.push(transcurrido);
    
    if (transcurrido >= parametrosActuales.value.tiempoTotalMin - 10) {
      parametrosActuales.value.tiempoTotalMin = transcurrido + 60;
    }
  }
  
  tragosFijos.value = [...tragosManuales.value];
  datosSimulacion.value = calcularPlanIngesta(parametrosActuales.value, tragosFijos.value, true);
};

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.manual-controls { margin-top: 20px; padding: 15px; background: #eef; border-radius: 8px; }
.btn-manual { width: 100%; padding: 12px; background-color: #ff9800; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; }
.btn-manual:hover { background-color: #e68a00; }
.status-manual { margin-top: 10px; font-size: 14px; color: #333; }
</style>