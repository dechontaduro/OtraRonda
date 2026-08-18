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
import { ref, onMounted, onUnmounted, watch } from 'vue';
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

// Persistencia en localStorage
onMounted(() => {
  const savedData = localStorage.getItem('otraronda_session');
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      if (parsed.modoManual) {
        modoManual.value = parsed.modoManual;
        startTimeManual.value = parsed.startTimeManual;
        tragosManuales.value = parsed.tragosManuales || [];
        parametrosActuales.value = parsed.parametrosActuales || {};
        
        tragosFijos.value = [...tragosManuales.value];
        datosSimulacion.value = calcularPlanIngesta(parametrosActuales.value, tragosFijos.value, true);

        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
          minutoActualManual.value = Math.floor((Date.now() - startTimeManual.value) / 60000);
        }, 1000);
      }
    } catch (e) {
      console.error("Error restaurando sesión", e);
    }
  }
});

watch([modoManual, startTimeManual, tragosManuales, parametrosActuales], () => {
  if (modoManual.value) {
    localStorage.setItem('otraronda_session', JSON.stringify({
      modoManual: modoManual.value,
      startTimeManual: startTimeManual.value,
      tragosManuales: tragosManuales.value,
      parametrosActuales: parametrosActuales.value
    }));
  } else {
    localStorage.removeItem('otraronda_session');
  }
}, { deep: true });

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