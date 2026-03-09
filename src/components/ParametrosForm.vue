<template>
  <form @submit.prevent="emitirCalculo" class="form-container">
    <label>Sexo:
      <select v-model="formParams.sexo">
        <option value="M">Masculino</option>
        <option value="F">Femenino</option>
      </select>
    </label>
    <label>Peso (Kg):
      <input type="number" v-model.number="formParams.pesoKg" min="40" max="150" />
    </label>
    <label>Objetivo BAC (mg/100ml):
      <select v-model.number="formParams.targetBAC">
        <option v-for="opc in nivelesBAC" :key="opc.valor" :value="opc.valor">{{ opc.etiqueta }}</option>
    </select>
    <input type="number" v-model.number="formParams.targetBAC" min="10" max="200" />
    </label>
    <label>Tiempo de Simulación (minutos):
      <input type="number" v-model.number="formParams.tiempoTotalMin" min="30" max="480" />
    </label>
    <label>Temp. Ambiente (°C):
      <input type="number" v-model.number="formParams.tempFinal" step="0.1" min="5" max="50" />
    </label>
<hr />
    <label>Bebida (% Alcohol):
      <select v-model.number="formParams.porcentajeAlcohol">
        <option v-for="opc in tiposBebida" :key="opc.alcohol" :value="opc.alcohol">{{ opc.etiqueta }}</option>
      </select>
      <input type="number" v-model.number="formParams.porcentajeAlcohol" step="0.1" min="1" max="90" />
    </label>
    <label>Volumen Bebida (cc):
        <select v-model.number="formParams.volumenBebida">
            <option v-for="opc in tamanosBebida" :key="opc.volumen" :value="opc.volumen">{{ opc.etiqueta }}</option>
        </select>
        <input type="number" v-model.number="formParams.volumenBebida" step="0.1" min="10" max="2000" />
    </label>
    <label>Volumen por Trago (cc):
        <input type="number" v-model.number="formParams.volumenTrago" min="10" max="100" />
    </label>
    <label>Tiempo mínimo entre tragos (minutos):
        <input type="number" v-model.number="formParams.minTiempoEntreTragos" min="1" max="60" />
    </label>
    <label>Temp. inicial bebida (°C):
      <input type="number" v-model.number="formParams.tempInicial" step="0.1" />
    </label>
    <label>Calentamiento bebida (°C/min):
      <input type="number" v-model.number="formParams.deltaTemp" step="0.01" />
    </label>

    <button type="submit">Calcular Ingesta</button>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { nivelesBAC, tiposBebida, tamanosBebida } from '../models/opciones.js';

const emit = defineEmits(['calcular']);

// Valores por defecto
const formParams = ref({
  targetBAC: 100,
  sexo: 'M',
  pesoKg: 60,
  tiempoTotalMin: 120,
  minTiempoEntreTragos: 2,
  porcentajeAlcohol: 4,
  volumenBebida: 330,
  volumenTrago: 40,
  tempInicial: 3.0,
  tempFinal: 20.0,
  deltaTemp: 0.68
});

const emitirCalculo = () => {
  emit('calcular', formParams.value);
};
</script>

<style scoped>
.form-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
h3 { grid-column: 1 / -1; margin-bottom: 5px; color: #333; }
label { display: flex; flex-direction: column; font-size: 14px; font-weight: bold; }
input, select { padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px; }
button { grid-column: 1 / -1; padding: 10px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
button:hover { background-color: #45a049; }
</style>