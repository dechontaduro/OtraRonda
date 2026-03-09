<template>
  <div ref="chartRef" style="width: 100%; height: 400px;"></div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

// El componente recibe el arreglo generado por el algoritmo
const props = defineProps({
  datosSimulacion: { type: Array, required: true, default: () => [] },
  parametros: { type: Object, required: true }
});

const chartRef = ref(null);
let chartInstance = null;

// Función adaptadora: Convierte el arreglo de la simulación al formato ECharts
const renderizarGrafico = () => {
  if (!chartInstance || !props.datosSimulacion.length) return;

  // Extraer vectores de datos
  const minutos = props.datosSimulacion.map(d => d.minuto);
  const bacData = props.datosSimulacion.map(d => d.bac);
  const tempData = props.datosSimulacion.map(d => d.temperatura);
  
  // Extraer puntos específicos para marcadores visuales
  const tragosData = props.datosSimulacion
    .filter(d => d.tomarTrago)
    .map(d =>  
        [d.minuto, d.bac, d.numeroTrago]
        //({ coord: [d.minuto, d.bac],
        // value: `${d.numeroTrago}` })
    );

  const nuevasBebidasData = props.datosSimulacion
    .filter(d => d.pedirNuevaBebida)
    .map(d => ({
      coord: [d.minuto, d.bac],
      value: `Bebida ${d.numeroBebida}`
    }));

  const option = {
    title: { text: 'Proyección de Alcoholemia', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['BAC (mg/100ml)', 'Temperatura (°C)', 'Trago'],
      top: 40
    },
    grid: { left: '5%', right: '5%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: minutos,
      name: 'Tiempo (min)',
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: [
      {
        type: 'value',
        name: 'BAC',
        position: 'left',
        max: props.parametros.targetBAC * 1.2,
        axisLine: { show: true, lineStyle: { color: '#d62728' } },
        axisLabel: { formatter: '{value} mg' }
      },
      {
        type: 'value',
        name: 'Temperatura',
        position: 'right',
        max: props.parametros.tempFinal,
        axisLine: { show: true, lineStyle: { color: '#1f77b4' } },
        axisLabel: { formatter: '{value} °C' }
      }
    ],
    series: [
      {
        name: 'BAC (mg/100ml)',
        type: 'line',
        yAxisIndex: 0,
        data: bacData,
        smooth: true,
        itemStyle: { color: '#d62728' },
        markLine: {
          data: [{ yAxis: props.parametros.targetBAC, name: 'Límite Objetivo' }], // Límite estático de ejemplo
          lineStyle: { color: 'red', type: 'dashed' }
        },
        // Marcamos el momento de pedir una nueva bebida
        markPoint: {
          symbol: 'pin',
          symbolSize: 50,
          itemStyle: { color: '#ff9900' },
          data: nuevasBebidasData
        },
      },
      {
        name: 'Temperatura (°C)',
        type: 'line',
        yAxisIndex: 1,
        data: tempData,
        smooth: true,
        itemStyle: { color: '#1f77b4' },
        lineStyle: { type: 'dashed' }
      },
      {
        name: 'Trago',
        type: 'scatter',
        yAxisIndex: 0,
        data: tragosData,
        itemStyle: { color: '#000000' },
        symbolSize: 8,
        tooltip: {
          valueFormatter: (value,dataIndex ) => tragosData[dataIndex][2]
        }
      }
    ]
  };

  chartInstance.setOption(option);
};

// Ciclo de vida del componente
onMounted(() => {
  chartInstance = echarts.init(chartRef.value);
  renderizarGrafico();
});

// Reactividad: Si cambian los parámetros y se genera un nuevo arreglo, se actualiza el gráfico
watch(() => props.datosSimulacion, () => {
  renderizarGrafico();
}, { deep: true });

// Limpieza de memoria
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
  }
});
</script>