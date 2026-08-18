export function calcularPlanIngesta(params, tragosFijos = [], soloManual = false) {
    const {
        targetBAC, sexo, pesoKg, porcentajeAlcohol, volumenBebida,
        tempInicial, tempFinal, deltaTemp, volumenTrago, minTiempoEntreTragos,
        tiempoTotalMin, tiempoAbsorcionMin = 20
    } = params;

    const densidadAlcohol = 0.789;
    const factorWidmark = sexo === 'M' ? 0.68 : 0.55;
    const eliminacionPorMinuto = 15 / 60;

    let bacActual = 0;
    let tempActual = tempInicial;
    let volumenRestante = volumenBebida;
    let numeroBebida = 1;
    let numeroTrago = 0;
    let minutoUltimoTrago = -minTiempoEntreTragos;

    const serieDatos = [];
    const bacPendienteDeAbsorcion = new Array(tiempoTotalMin + tiempoAbsorcionMin + 1).fill(0);

    // Identificamos hasta dónde el usuario ha manipulado la línea de tiempo
    const ultimoTragoFijo = tragosFijos.length > 0 ? Math.max(...tragosFijos) : -1;

    for (let minuto = 0; minuto <= tiempoTotalMin; minuto++) {
        let tomarTrago = false;
        let pedirNuevaBebida = false;

        // 1. Metabolización y absorción
        if (minuto > 0) bacActual = Math.max(0, bacActual - eliminacionPorMinuto);
        bacActual += bacPendienteDeAbsorcion[minuto];

        // 2. Calentamiento y recambio
        if (volumenRestante > 0 && minuto > 0)
            tempActual = Math.min(tempFinal, tempActual + deltaTemp);

        if (volumenRestante <= 0) {
            pedirNuevaBebida = true;
            volumenRestante = volumenBebida;
            tempActual = tempInicial;
            numeroBebida++;
        }

        // 3. Lógica de decisión de trago
        const cantidadTragosForzados = tragosFijos.filter(m => m === minuto).length;
        const esTragoForzado = cantidadTragosForzados > 0;
        const puedeTomarPorTiempo = (minuto - minutoUltimoTrago) >= minTiempoEntreTragos;

        let bacFuturoAcumulado = bacActual;
        for (let i = minuto + 1; i < bacPendienteDeAbsorcion.length; i++)
            bacFuturoAcumulado += bacPendienteDeAbsorcion[i];

        // Permitir que el algoritmo genere tragos SOLO si no estamos en modo manual y ya pasamos la zona de tragos manipulados
        const permitirGreedy = !soloManual && (minuto > ultimoTragoFijo);

        // Simulamos el "próximo" trago para la lógica predictiva
        let tragoRealPredictivo = Math.min(volumenTrago, volumenRestante);
        let bacTragoPredictivo = (tragoRealPredictivo * (porcentajeAlcohol / 100) * densidadAlcohol / (pesoKg * factorWidmark)) * 100;

        if (esTragoForzado ||
            (permitirGreedy && puedeTomarPorTiempo &&
                (bacFuturoAcumulado + bacTragoPredictivo) <= targetBAC)) {
            
            const tragosEnEsteMinuto = esTragoForzado ? cantidadTragosForzados : 1;
            tomarTrago = true;

            for (let t = 0; t < tragosEnEsteMinuto; t++) {
                numeroTrago++;
                let tragoReal = Math.min(volumenTrago, volumenRestante);
                volumenRestante -= tragoReal;
                minutoUltimoTrago = minuto;

                let gramosTrago = tragoReal * (porcentajeAlcohol / 100) * densidadAlcohol;
                let bacTragoReal = (gramosTrago / (pesoKg * factorWidmark)) * 100;

                const bacPorMinutoAbsorcion = bacTragoReal / tiempoAbsorcionMin;
                for (let i = 1; i <= tiempoAbsorcionMin; i++) {
                    if (minuto + i < bacPendienteDeAbsorcion.length) {
                        bacPendienteDeAbsorcion[minuto + i] += bacPorMinutoAbsorcion;
                    }
                }

                // Si se acaba la bebida tomando estos múltiples tragos rápidos, pedir otra
                if (volumenRestante <= 0 && t < tragosEnEsteMinuto - 1) {
                    pedirNuevaBebida = true;
                    volumenRestante = volumenBebida;
                    tempActual = tempInicial;
                    numeroBebida++;
                }
            }
        }

        serieDatos.push({
            minuto,
            bac: Number(bacActual.toFixed(3)),
            temperatura: Number(tempActual.toFixed(2)),
            tomarTrago: (minuto === 0 && !soloManual) ? true : tomarTrago,
            pedirNuevaBebida: (minuto === 0 && !soloManual) ? true : pedirNuevaBebida,
            numeroBebida,
            numeroTrago,
            volumenRestante: Number(volumenRestante.toFixed(2))
        });
    }
    return serieDatos;
}