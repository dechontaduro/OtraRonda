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

const emit = defineEmits(['toggleTrago']);

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
          //symbol: 'none',
          symbolSize: 0,
          itemStyle: { color: '#ff9900' },
          data: nuevasBebidasData,
          label: {position: 'inside',
                 fontSize: 20,
                  formatter: props.parametros.tipoBebida.icon || '⭐'
                }
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
        symbol: 'diamond', 
        symbolSize: 10,
        tooltip: {
          valueFormatter: (value,dataIndex ) => tragosData[dataIndex][2]
        }
      },
    ]
  };

  chartInstance.setOption(option, { replaceMerge: ['series'] });
};

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

// Ciclo de vida del componente
onMounted(() => {
  chartInstance = echarts.init(chartRef.value);
  
  // Agregar listener para clic (tap) en el lienzo (ZRender)
  chartInstance.getZr().on('click', function (params) {
    const pointInPixel = [params.offsetX, params.offsetY];
    if (chartInstance.containPixel('grid', pointInPixel)) {
      const pointInGrid = chartInstance.convertFromPixel('grid', pointInPixel);
      const minutoClicked = Math.round(pointInGrid[0]);
      
      if (minutoClicked >= 0 && props.datosSimulacion.length > 0) {
        const margenTolerancia = props.parametros.minTiempoEntreTragos || 5;
        // Encontrar si hay un trago cercano (usando el tiempo mínimo entre tragos como margen)
        const tragosExistentes = props.datosSimulacion.filter(d => d.tomarTrago).map(d => d.minuto);
        
        let tragoCercano = undefined;
        let minimaDistancia = Infinity;
        
        tragosExistentes.forEach(m => {
          const distancia = Math.abs(m - minutoClicked);
          if (distancia <= margenTolerancia && distancia < minimaDistancia) {
            minimaDistancia = distancia;
            tragoCercano = m;
          }
        });
        
        if (tragoCercano !== undefined) {
          emit('toggleTrago', tragoCercano);
        } else {
          emit('toggleTrago', Math.max(0, minutoClicked));
        }
      }
    }
  });

  renderizarGrafico();
  window.addEventListener('resize', handleResize);
});

// Reactividad: Si cambian los parámetros y se genera un nuevo arreglo, se actualiza el gráfico
watch(() => props.datosSimulacion, () => {
  renderizarGrafico();
}, { deep: true });

// Limpieza de memoria
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (chartInstance) {
    chartInstance.dispose();
  }
});
</script>