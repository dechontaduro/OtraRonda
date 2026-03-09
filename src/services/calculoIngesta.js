export function calcularPlanIngesta(params, tragosFijos = []) {
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
        const esTragoForzado = tragosFijos.includes(minuto);
        const puedeTomarPorTiempo = (minuto - minutoUltimoTrago) >= minTiempoEntreTragos;

        let tragoReal = Math.min(volumenTrago, volumenRestante);
        let gramosTrago = tragoReal * (porcentajeAlcohol / 100) * densidadAlcohol;
        let bacTragoReal = (gramosTrago / (pesoKg * factorWidmark)) * 100;

        let bacFuturoAcumulado = bacActual;
        for (let i = minuto + 1; i < bacPendienteDeAbsorcion.length; i++)
            bacFuturoAcumulado += bacPendienteDeAbsorcion[i];

        // Permitir que el algoritmo genere tragos SOLO si ya pasamos la zona de tragos manipulados por el usuario
        const permitirGreedy = minuto > ultimoTragoFijo;

        if (esTragoForzado ||
            (permitirGreedy && puedeTomarPorTiempo &&
                (bacFuturoAcumulado + bacTragoReal) <= targetBAC)) {
            tomarTrago = true;
            volumenRestante -= tragoReal;
            minutoUltimoTrago = minuto;

            const bacPorMinutoAbsorcion = bacTragoReal / tiempoAbsorcionMin;
            for (let i = 1; i <= tiempoAbsorcionMin; i++) {
                if (minuto + i < bacPendienteDeAbsorcion.length) {
                    bacPendienteDeAbsorcion[minuto + i] += bacPorMinutoAbsorcion;
                }
            }
        }

        serieDatos.push({
            minuto,
            bac: Number(bacActual.toFixed(3)),
            temperatura: Number(tempActual.toFixed(2)),
            tomarTrago: (minuto === 0) ? true : tomarTrago,
            pedirNuevaBebida: (minuto === 0) ? true : pedirNuevaBebida,
            bebidaActual: numeroBebida,
            volumenRestante: Number(volumenRestante.toFixed(2))
        });
    }
    return serieDatos;
}