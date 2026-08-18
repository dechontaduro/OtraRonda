<template>
    <div class="layout">
      <aside class="sidebar">
        <ParametrosForm @calcular="reiniciarSimulacion" />
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
import { ref } from 'vue';
import ParametrosForm from '../components/ParametrosForm.vue';
import GraficoIngesta from '../components/GraficoIngesta.vue';
import ResumenIngesta from '../components/ResumenIngesta.vue';
import { calcularPlanIngesta } from '../services/calculoIngesta.js';

const datosSimulacion = ref([]);
const parametrosActuales = ref({});
const tragosFijos = ref([]); // Almacena la lista de minutos donde el usuario fijó un trago

// Se llama cuando el usuario modifica los parámetros globales en el formulario lateral
const reiniciarSimulacion = (params) => {
  parametrosActuales.value = { ...params };
  tragosFijos.value = []; // Si cambia su peso o bebida, borramos la interacción manual
  
  // Ejecutar simulación base
  datosSimulacion.value = calcularPlanIngesta(params, []);
  
  // Capturar el plan generado como la nueva base de tragos fijos
  tragosFijos.value = datosSimulacion.value
                        .filter(d => d.tomarTrago)
                        .map(d => d.minuto);
};

// Se llama cuando ECharts emite un doble clic para agregar/quitar tragos
const manejarToggleTrago = (minuto) => {
  let nuevosTragos = [...tragosFijos.value];
  const index = nuevosTragos.indexOf(minuto);
  
  if (index > -1) {
    // Si el trago ya existe, lo quitamos
    nuevosTragos.splice(index, 1);
  } else {
    // Si no existe, lo agregamos y ordenamos
    nuevosTragos.push(minuto);
    nuevosTragos.sort((a, b) => a - b);
  }
  
  // Actualizar estado y recalcular toda la curva respetando esta nueva configuración
  tragosFijos.value = nuevosTragos;
  datosSimulacion.value = calcularPlanIngesta(parametrosActuales.value, tragosFijos.value);
};
</script>