<template>
  <div ref="chartRef" style="width: 100%; height: 400px;"></div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  datosSimulacion: Array
});
const emit = defineEmits(['tragoMovido']);

const chartRef = ref(null);
let chartInstance = null;

const renderizarGrafico = () => {
  if (!chartInstance || !props.datosSimulacion.length) return;

  const minutos = props.datosSimulacion.map(d => d.minuto);
  const bacData = props.datosSimulacion.map(d => d.bac);
  const tempData = props.datosSimulacion.map(d => d.temperatura);
  
  const tragosData = props.datosSimulacion
    .filter(d => d.tomarTrago)
    .map(d => [d.minuto, d.bac]);

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '5%', right: '5%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', data: minutos, name: 'Tiempo (min)' },
    yAxis: [
      { type: 'value', name: 'BAC', max: 120, axisLine: { lineStyle: { color: '#d62728' } } },
      { type: 'value', name: 'Temp', max: 20, position: 'right', axisLine: { lineStyle: { color: '#1f77b4' } } }
    ],
    series: [
      { type: 'line', data: bacData, smooth: true, itemStyle: { color: '#d62728' } },
      { type: 'line', yAxisIndex: 1, data: tempData, smooth: true, itemStyle: { color: '#1f77b4' }, lineStyle: { type: 'dashed' } },
      { type: 'scatter', data: tragosData, symbolSize: 10, itemStyle: { color: '#000' } }
    ],
    // Aquí definimos los puntos arrastrables
    graphic: tragosData.map((dataItem, index) => {
      return {
        type: 'circle',
        position: chartInstance.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, dataItem),
        shape: { r: 15 }, // Área de agarre más grande que el punto visual
        invisible: true, // Se mantiene invisible, solo sirve para interactuar
        draggable: 'horizontal', // Restringir movimiento solo al eje X (tiempo)
        z: 100,
        ondragend: function () {
          // Convertir los píxeles arrastrados de vuelta a minutos
          const newPoint = chartInstance.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, this.position);
          let nuevoMinuto = Math.round(newPoint[0]);
          
          // Prevenir que se arrastre fuera de los límites de tiempo
          if (nuevoMinuto < 0) nuevoMinuto = 0;
          if (nuevoMinuto > props.datosSimulacion.length - 1) nuevoMinuto = props.datosSimulacion.length - 1;

          emit('tragoMovido', { indexTrago: index, minutoOriginal: dataItem[0], nuevoMinuto });
        }
      };
    })
  };

  chartInstance.setOption(option, true);
};

onMounted(() => {
  chartInstance = echarts.init(chartRef.value);
  renderizarGrafico();
  // Al redimensionar la ventana, hay que recalcular las posiciones gráficas
  window.addEventListener('resize', () => chartInstance.resize());
});

watch(() => props.datosSimulacion, renderizarGrafico, { deep: true });

onBeforeUnmount(() => chartInstance?.dispose());
</script>