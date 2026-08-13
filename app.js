const formulario =
    document.getElementById("formMovimiento");

const lista =
    document.getElementById("listaMovimientos");

const saldoTexto =
    document.getElementById("saldo");

const ingresosTexto =
    document.getElementById("ingresos");

const gastosTexto =
    document.getElementById("gastos");


// Recuperar datos guardados

let movimientos =
    JSON.parse(localStorage.getItem("movimientos")) || [];

// ======================================
// RECIBIR MOVIMIENTOS DESDE FIREBASE
// ======================================

window.cargarMovimientosDesdeNube =
    function(datos) {

        movimientos =
            Array.isArray(datos)
                ? datos
                : [];


        localStorage.setItem(
            "movimientos",
            JSON.stringify(
                movimientos
            )
        );


        actualizarPantalla();


        console.log(
            "✅ App actualizada desde Firebase"
        );

    };

// ======================================
// METAS DE AHORRO
// ======================================

let metas =
    JSON.parse(
        localStorage.getItem("metas")
    ) || [];

// ======================================
// PRESUPUESTOS
// ======================================

let presupuestosPorMes =
    JSON.parse(
        localStorage.getItem(
            "presupuestosPorMes"
        )
    ) || {};

function obtenerClaveMesActual() {

    const ahora =
        new Date();


    const anio =
        ahora.getFullYear();


    const mes =
        String(
            ahora.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    return `${anio}-${mes}`;

}
    // Asegurar compatibilidad

metas = metas.map(meta => ({

    ...meta,

    aportes:
        Array.isArray(meta.aportes)
            ? meta.aportes
            : []

}));

function obtenerPresupuestosMesActual() {

    const clave =
        obtenerClaveMesActual();


    if (
        !presupuestosPorMes[clave]
    ) {

        presupuestosPorMes[clave] =
            {};

    }


    return presupuestosPorMes[
        clave
    ];

}

let presupuestos =
    obtenerPresupuestosMesActual();

const presupuestosAntiguos =
    JSON.parse(
        localStorage.getItem(
            "presupuestos"
        )
    ) || {};


if (
    Object.keys(presupuestos).length === 0
    &&
    Object.keys(
        presupuestosAntiguos
    ).length > 0
) {

    presupuestos =
        {
            ...presupuestosAntiguos
        };


    presupuestosPorMes[
        obtenerClaveMesActual()
    ] =
        presupuestos;


    localStorage.setItem(
        "presupuestosPorMes",
        JSON.stringify(
            presupuestosPorMes
        )
    );

}

// ======================================
// INGRESOS RECURRENTES Y GASTOS FIJOS
// ======================================

let recurrentes =
    JSON.parse(
        localStorage.getItem(
            "recurrentes"
        )
    ) || [];

// FORMATO USD

function dinero(valor) {

    return new Intl.NumberFormat(
        "es-EC",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(valor);

}


// GUARDAR MOVIMIENTO

formulario.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const tipo =
            document.getElementById("tipo").value;

        const monto =
            Number(document.getElementById("monto").value);

        const categoria =
            document.getElementById("categoria").value;

        const descripcion =
            document.getElementById("descripcion").value;


        const movimiento = {

            id: Date.now(),

            tipo: tipo,

            monto: monto,

            categoria: categoria,

            descripcion: descripcion,

            fecha: new Date().toLocaleString(),

            fechaISO:
                new Date().toISOString()

        };


        movimientos.push(movimiento);

        if (window.guardarMovimientoNube) {
            window.guardarMovimientoNube(
                movimiento
            );
        }
        guardarDatos();

        actualizarPantalla();

        formulario.reset();

    }
);


// GUARDAR EN EL NAVEGADOR

function guardarDatos() {

    localStorage.setItem(
        "movimientos",
        JSON.stringify(movimientos)
    );

}


// ACTUALIZAR TODO

function actualizarPantalla() {

    calcularResumen();

    mostrarMovimientos();


    if (
        typeof actualizarPresupuestos ===  "function"
    ) {

        actualizarPresupuestos();

    }

}


// CALCULAR DINERO

function calcularResumen() {

    let ingresos = 0;
    let gastos = 0;


    movimientos.forEach(movimiento => {

        if (movimiento.tipo === "ingreso") {

            ingresos += movimiento.monto;

        } else {

            gastos += movimiento.monto;

        }

    });


    const saldoReal =
        ingresos - gastos;


    const ahorroReservado =
        obtenerAhorroReservado();


    const saldo =
        saldoReal -
        ahorroReservado;


    saldoTexto.textContent =
        dinero(saldo);

    ingresosTexto.textContent =
        dinero(ingresos);

    gastosTexto.textContent =
        dinero(gastos);

}


// ======================================
// MOSTRAR MOVIMIENTOS
// ======================================

function mostrarMovimientos() {

    lista.innerHTML = "";


    if (movimientos.length === 0) {

        lista.innerHTML = `
            <p class="vacio">
                Todavía no existen movimientos.
            </p>
        `;

        return;
    }


    const movimientosInvertidos =
        [...movimientos].reverse();


    movimientosInvertidos.forEach(
        movimiento => {

            const div =
                document.createElement("div");


            div.className =
                "movimiento movimiento-completo";


            const signo =
                movimiento.tipo === "ingreso"
                    ? "+"
                    : "-";


            const vinculadoDeuda =
                movimientoVinculadoADeuda(
                    movimiento.id
                );


            div.innerHTML = `

                <div class="movimiento-info">

                    <strong>
                        ${movimiento.descripcion ||
                        movimiento.categoria}
                    </strong>

                    <p>
                        ${movimiento.categoria}
                    </p>

                    <small>
                        ${movimiento.fecha}
                    </small>

                </div>


                <div class="movimiento-derecha">

                    <strong
                        class="${
                            movimiento.tipo ===
                            "ingreso"
                            ? "monto-ingreso"
                            : "monto-gasto"
                        }"
                    >

                        ${signo}${dinero(
                            movimiento.monto
                        )}

                    </strong>


                    <div class="acciones-movimiento">

                        ${
                            vinculadoDeuda
                            ? `

                            <span
                                class="movimiento-bloqueado"
                                title="Este movimiento pertenece a un pago de deuda"
                            >
                                🔒 Deuda
                            </span>

                            `
                            : `

                            <button
                                class="btn-editar-movimiento"
                                onclick="
                                    editarMovimiento(
                                        ${movimiento.id}
                                    )
                                "
                            >
                                Editar
                            </button>


                            <button
                                class="btn-eliminar-movimiento"
                                onclick="
                                    eliminarMovimiento(
                                        ${movimiento.id}
                                    )
                                "
                            >
                                Eliminar
                            </button>

                            `
                        }

                    </div>

                </div>

            `;


            lista.appendChild(div);

        }
    );

}

// ======================================
// SABER SI UN MOVIMIENTO VIENE DE DEUDAS
// ======================================

function movimientoVinculadoADeuda(
    movimientoId
) {

    const deudasGuardadas =
        JSON.parse(
            localStorage.getItem("deudas")
        ) || [];


    for (
        const deuda of deudasGuardadas
    ) {

        if (!Array.isArray(deuda.pagos)) {
            continue;
        }


        const existePago =
            deuda.pagos.some(
                pago =>
                    pago.movimientoId ===
                    movimientoId
            );


        if (existePago) {

            return true;

        }

    }


    return false;

}

// ======================================
// EDITAR MOVIMIENTO
// ======================================

function editarMovimiento(id) {

    const movimiento =
        movimientos.find(
            movimiento =>
                movimiento.id === id
        );


    if (!movimiento) {
        return;
    }


    // Protección

    if (
        movimientoVinculadoADeuda(id)
    ) {

        alert(
            "Este movimiento pertenece a " +
            "un pago de deuda.\n\n" +
            "Debes modificarlo desde " +
            "la sección Deudas."
        );

        return;
    }


    // ==========================
    // MONTO
    // ==========================

    const nuevoMontoTexto =
        prompt(
            "Nuevo monto:",
            movimiento.monto
        );


    if (nuevoMontoTexto === null) {
        return;
    }


    const nuevoMonto =
        Number(
            nuevoMontoTexto.replace(
                ",",
                "."
            )
        );


    if (
        isNaN(nuevoMonto) ||
        nuevoMonto <= 0
    ) {

        alert(
            "El monto ingresado no es válido."
        );

        return;
    }


    // ==========================
    // DESCRIPCIÓN
    // ==========================

    const nuevaDescripcion =
        prompt(
            "Descripción:",
            movimiento.descripcion || ""
        );


    if (nuevaDescripcion === null) {
        return;
    }


    // ==========================
    // TIPO
    // ==========================

    const nuevoTipo =
        prompt(
            "Tipo de movimiento:\n" +
            "Escribe ingreso o gasto",
            movimiento.tipo
        );


    if (nuevoTipo === null) {
        return;
    }


    const tipoNormalizado =
        nuevoTipo
            .trim()
            .toLowerCase();


    if (
        tipoNormalizado !== "ingreso" &&
        tipoNormalizado !== "gasto"
    ) {

        alert(
            "Debes escribir ingreso o gasto."
        );

        return;
    }


    // ==========================
    // GUARDAR CAMBIOS
    // ==========================

    movimiento.monto =
        nuevoMonto;


    movimiento.descripcion =
        nuevaDescripcion.trim();


    movimiento.tipo =
        tipoNormalizado;


    guardarDatos();

    // ACTUALIZAR TAMBIÉN EN FIREBASE

    if (
        window.guardarMovimientoNube
    ) {

        window.guardarMovimientoNube(
            movimiento
        );

    }
    actualizarPantalla();


    alert(
        "Movimiento actualizado."
    );

}

// ======================================
// ELIMINAR MOVIMIENTO
// ======================================

function eliminarMovimiento(id) {

    const movimiento =
        movimientos.find(
            movimiento =>
                movimiento.id === id
        );


    if (!movimiento) {
        return;
    }


    // Protección de deuda

    if (
        movimientoVinculadoADeuda(id)
    ) {

        alert(
            "No puedes eliminar este " +
            "movimiento directamente.\n\n" +

            "Este registro fue generado " +
            "por un pago de deuda.\n\n" +

            "Ve a Deudas y utiliza " +
            "\"Deshacer último pago\"."
        );

        return;
    }


    const confirmar =
        confirm(
            "¿Eliminar este movimiento?\n\n" +

            (movimiento.descripcion ||
            movimiento.categoria) +

            "\n" +

            dinero(
                movimiento.monto
            )
        );


    if (!confirmar) {
        return;
    }


    movimientos =
        movimientos.filter(
            movimiento =>
                movimiento.id !== id
        );


    // ELIMINAR TAMBIÉN DE FIREBASE

    if (
        window.eliminarMovimientoNube
    ) {

        window.eliminarMovimientoNube(
            id
        );

    }


    guardarDatos();

    actualizarPantalla();


    alert(
        "Movimiento eliminado."
    );

}


// ======================================
// NAVEGACIÓN ENTRE PANTALLAS
// ======================================

const botonesMenu =
    document.querySelectorAll(".boton-menu");

const pantallas =
    document.querySelectorAll(".pantalla");


botonesMenu.forEach(boton => {

    boton.addEventListener("click", function() {

        // Obtener pantalla seleccionada

        const nombrePantalla =
            boton.dataset.pantalla;


        // Ocultar todas las pantallas

        pantallas.forEach(pantalla => {

            pantalla.classList.remove(
                "pantalla-activa"
            );

        });


        // Quitar selección del menú

        botonesMenu.forEach(botonMenu => {

            botonMenu.classList.remove(
                "activo"
            );

        });


        // Mostrar pantalla seleccionada

        const pantallaSeleccionada =
            document.getElementById(
                "pantalla-" + nombrePantalla
            );


        pantallaSeleccionada.classList.add(
            "pantalla-activa"
        );


        // Marcar botón seleccionado

        boton.classList.add("activo");


        // Llevar arriba de la pantalla

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

});

// ======================================
// SISTEMA DE DEUDAS
// ======================================


// Recuperar deudas guardadas

let deudas =
    JSON.parse(
        localStorage.getItem("deudas")
    ) || [];

// Asegurar que todas las deudas tengan historial de pagos
deudas = deudas.map(deuda => ({
    ...deuda,

    pagos: Array.isArray(deuda.pagos)
        ? deuda.pagos
        : []
}));

// ELEMENTOS HTML

const formDeuda =
    document.getElementById("formDeuda");

const listaDeudas =
    document.getElementById("listaDeudas");

const totalYoDeboTexto =
    document.getElementById("totalYoDebo");

const totalMeDebenTexto =
    document.getElementById("totalMeDeben");

const balanceDeudasTexto =
    document.getElementById("balanceDeudas");

const deudasInicioTexto =
    document.getElementById("deudasInicio");



// ======================================
// CREAR DEUDA
// ======================================

formDeuda.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const tipo =
            document.getElementById(
                "tipoDeuda"
            ).value;


        const persona =
            document.getElementById(
                "personaDeuda"
            ).value.trim();


        const monto =
            Number(
                document.getElementById(
                    "montoDeuda"
                ).value
            );


        const fecha =
            document.getElementById(
                "fechaDeuda"
            ).value;


        const descripcion =
            document.getElementById(
                "descripcionDeuda"
            ).value.trim();


        if (monto <= 0) {
            return;
        }


        const nuevaDeuda = {

            id: Date.now(),

            tipo: tipo,

            persona: persona,

            montoOriginal: monto,

            pagado: 0,

            pagos: [],

            fechaVencimiento: fecha,

            descripcion: descripcion,

            fechaCreacion:
                new Date().toISOString()

        };


        deudas.push(nuevaDeuda);


        guardarDeudas();

        actualizarDeudas();

        formDeuda.reset();

    }
);



// ======================================
// GUARDAR
// ======================================

function guardarDeudas() {

    localStorage.setItem(
        "deudas",
        JSON.stringify(deudas)
    );

}



// ======================================
// ACTUALIZAR MÓDULO
// ======================================

function actualizarDeudas() {

    calcularResumenDeudas();

    mostrarDeudas();

}



// ======================================
// CALCULAR RESUMEN
// ======================================

function calcularResumenDeudas() {

    let yoDebo = 0;

    let meDeben = 0;


    deudas.forEach(deuda => {

        const pendiente =
            Math.max(
                deuda.montoOriginal -
                deuda.pagado,
                0
            );


        if (deuda.tipo === "yo_debo") {

            yoDebo += pendiente;

        }


        if (deuda.tipo === "me_deben") {

            meDeben += pendiente;

        }

    });


    const balance =
        meDeben - yoDebo;


    totalYoDeboTexto.textContent =
        dinero(yoDebo);


    totalMeDebenTexto.textContent =
        dinero(meDeben);


    balanceDeudasTexto.textContent =
        dinero(balance);


    // También mostrar en Inicio

    if (deudasInicioTexto) {

        deudasInicioTexto.textContent =
            dinero(yoDebo);

    }

}



// ======================================
// MOSTRAR DEUDAS
// ======================================

function mostrarDeudas() {

    listaDeudas.innerHTML = "";


    if (deudas.length === 0) {

        listaDeudas.innerHTML = `

            <p class="vacio">
                Todavía no tienes deudas registradas.
            </p>

        `;

        return;

    }


    // Mostrar pendientes primero

    const ordenadas =
        [...deudas].sort((a, b) => {

            const pendienteA =
                a.montoOriginal - a.pagado;

            const pendienteB =
                b.montoOriginal - b.pagado;


            if (
                pendienteA > 0 &&
                pendienteB <= 0
            ) {
                return -1;
            }


            if (
                pendienteA <= 0 &&
                pendienteB > 0
            ) {
                return 1;
            }


            return b.id - a.id;

        });



    ordenadas.forEach(deuda => {

        const pendiente =
            Math.max(
                deuda.montoOriginal -
                deuda.pagado,
                0
            );


        const porcentaje =
            Math.min(
                (deuda.pagado /
                deuda.montoOriginal) * 100,
                100
            );


        const pagada =
            pendiente <= 0;

        const historialPagos =
            Array.isArray(deuda.pagos)
                ? deuda.pagos
                : [];


        let historialHTML = "";


        if (historialPagos.length > 0) {

            historialHTML = `

                <div class="historial-pagos">

                    <h4>
                        Historial de pagos
                    </h4>

                    ${

                        [...historialPagos]

                            .reverse()

                            .map(pago => {

                                const fechaPago =
                                    new Date(
                                        pago.fecha
                                    );


                                return `

                                    <div class="pago-item">

                                        <div>

                                            <strong>
                                                Pago
                                            </strong>

                                            <small>
                                                ${
                                                    fechaPago
                                                        .toLocaleString(
                                                            "es-EC"
                                                        )
                                                }
                                            </small>

                                        </div>


                                        <strong>
                                            ${dinero(
                                                pago.monto
                                            )}
                                        </strong>

                                    </div>

                                `;

                            })

                            .join("")

                    }

                </div>

            `;

        }

        const tipoTexto =
            deuda.tipo === "yo_debo"
            ? "Yo debo"
            : "Me deben";


        const claseTipo =
            deuda.tipo === "yo_debo"
            ? "tipo-yo-debo"
            : "tipo-me-deben";


        let fechaTexto =
            "Sin fecha";


        let claseFecha = "";


        if (deuda.fechaVencimiento) {

            fechaTexto =
                formatearFechaDeuda(
                    deuda.fechaVencimiento
                );


            const hoy =
                new Date();

            hoy.setHours(0, 0, 0, 0);


            const vencimiento =
                new Date(
                    deuda.fechaVencimiento +
                    "T00:00:00"
                );


            if (
                vencimiento < hoy &&
                !pagada
            ) {

                claseFecha =
                    "fecha-vencida";

            }

        }



        const div =
            document.createElement("div");


        div.className =
            "deuda-item";


        div.innerHTML = `

            <div class="deuda-superior">

                <div>

                    <h3 class="deuda-persona">
                        ${deuda.persona}
                    </h3>

                    <p class="deuda-descripcion">
                        ${deuda.descripcion ||
                        "Sin descripción"}
                    </p>

                    <span
                        class="tipo-deuda ${claseTipo}"
                    >
                        ${tipoTexto}
                    </span>

                </div>


                <span
                    class="estado-deuda
                    ${
                        pagada
                        ? "estado-pagada"
                        : "estado-pendiente"
                    }"
                >

                    ${
                        pagada
                        ? "Pagada"
                        : "Pendiente"
                    }

                </span>

            </div>



            <div class="deuda-datos">

                <div class="deuda-dato">

                    <small>
                        Original
                    </small>

                    <strong>
                        ${dinero(
                            deuda.montoOriginal
                        )}
                    </strong>

                </div>


                <div class="deuda-dato">

                    <small>
                        Pagado
                    </small>

                    <strong>
                        ${dinero(
                            deuda.pagado
                        )}
                    </strong>

                </div>


                <div class="deuda-dato">

                    <small>
                        Pendiente
                    </small>

                    <strong>
                        ${dinero(
                            pendiente
                        )}
                    </strong>

                </div>

            </div>



            <div class="barra-deuda">

                <div
                    class="barra-deuda-progreso"
                    style="
                        width:
                        ${porcentaje}%
                    "
                >
                </div>

            </div>



            <p class="${claseFecha}">

                Vence:
                ${fechaTexto}

            </p>

            ${historialHTML}               

            <div class="acciones-deuda">

                ${
                    !pagada
                    ? `

                    <button
                        class="btn-pago"
                        onclick="
                            registrarPagoDeuda(
                                ${deuda.id}
                            )
                        "
                    >
                        + Registrar pago
                    </button>

                    `
                    : ""
                }

                ${
                    deuda.pagos &&
                    deuda.pagos.length > 0
                    ? `

                    <button
                        class="btn-deshacer"
                        onclick="
                            deshacerUltimoPago(
                                ${deuda.id}
                            )
                        "
                    >
                        ↶ Deshacer último pago
                    </button>

                    `
                    : ""
                }   

                <button
                    class="btn-eliminar"
                    onclick="
                        eliminarDeuda(
                            ${deuda.id}
                        )
                    "
                >
                    Eliminar
                </button>

            </div>

        `;


        listaDeudas.appendChild(div);

    });

}

// ======================================
// CREAR MOVIMIENTO AUTOMÁTICO
// ======================================

function crearMovimientoAutomatico(
    tipo,
    monto,
    categoria,
    descripcion
) {

    const movimiento = {

        id: Date.now(),

        tipo: tipo,

        monto: monto,

        categoria: categoria,

        descripcion: descripcion,

        fecha: new Date().toLocaleString(),

        fechaISO: new Date().toISOString()

    };


    movimientos.push(movimiento);


    // GUARDAR TAMBIÉN EN FIREBASE

    if (
        window.guardarMovimientoNube
    ) {

        window.guardarMovimientoNube(
            movimiento
        );

    }

    guardarDatos();

    actualizarPantalla();


    // MUY IMPORTANTE:
    // devolver el ID para poder eliminar
    // este movimiento si deshacemos el pago

    return movimiento.id;

}

// ======================================
// REGISTRAR PAGO DE DEUDA
// ======================================

function registrarPagoDeuda(id) {

    const deuda =
        deudas.find(
            deuda => deuda.id === id
        );


    if (!deuda) {
        return;
    }


    const pendiente =
        Math.max(
            deuda.montoOriginal -
            deuda.pagado,
            0
        );


    const respuesta =
        prompt(
            "Monto del pago.\n" +
            "Pendiente: " +
            dinero(pendiente)
        );


    if (respuesta === null) {
        return;
    }


    const pago =
        Number(
            respuesta.replace(",", ".")
        );


    if (
        isNaN(pago) ||
        pago <= 0
    ) {

        alert(
            "Ingresa un monto válido."
        );

        return;
    }


    if (pago > pendiente) {

        alert(
            "El pago no puede superar " +
            "el saldo pendiente."
        );

        return;
    }


    // ==================================
    // CREAR MOVIMIENTO RELACIONADO
    // ==================================

    let movimientoId;


    if (deuda.tipo === "yo_debo") {

        movimientoId =
            crearMovimientoAutomatico(

                "gasto",

                pago,

                "Deudas",

                "Pago de deuda a " +
                deuda.persona

            );

    }


    if (deuda.tipo === "me_deben") {

        movimientoId =
            crearMovimientoAutomatico(

                "ingreso",

                pago,

                "Deudas",

                "Cobro de deuda de " +
                deuda.persona

            );

    }


    // ==================================
    // GUARDAR EL PAGO
    // ==================================

    deuda.pagado += pago;


    if (!Array.isArray(deuda.pagos)) {

        deuda.pagos = [];

    }


    deuda.pagos.push({

        id: Date.now(),

        monto: pago,

        fecha:
            new Date().toISOString(),

        movimientoId:
            movimientoId

    });


    guardarDeudas();

    actualizarDeudas();


    alert(
        "Pago registrado correctamente."
    );

}

// ======================================
// DESHACER ÚLTIMO PAGO
// ======================================

function deshacerUltimoPago(id) {

    const deuda =
        deudas.find(
            deuda => deuda.id === id
        );


    if (!deuda) {
        return;
    }


    if (
        !Array.isArray(deuda.pagos) ||
        deuda.pagos.length === 0
    ) {

        alert(
            "Esta deuda no tiene pagos que puedan deshacerse."
        );

        return;
    }


    // Obtener último pago

    const ultimoPago =
        deuda.pagos[
            deuda.pagos.length - 1
        ];


    const confirmar =
        confirm(

            "¿Deshacer el último pago?\n\n" +

            "Monto: " +
            dinero(ultimoPago.monto)

        );


    if (!confirmar) {
        return;
    }


    // ==================================
    // DEVOLVER SALDO A LA DEUDA
    // ==================================

    deuda.pagado =
        Math.max(
            deuda.pagado -
            ultimoPago.monto,
            0
        );


    // ==================================
    // ELIMINAR PAGO DEL HISTORIAL
    // ==================================

    deuda.pagos.pop();


    // ==================================
    // ELIMINAR MOVIMIENTO RELACIONADO
    // ==================================

    movimientos =
        movimientos.filter(
            movimiento =>
                movimiento.id !==
                ultimoPago.movimientoId
        );


    // Guardar movimientos

    guardarDatos();


    // Guardar deuda

    guardarDeudas();


    // Actualizar pantallas

    actualizarPantalla();

    actualizarDeudas();


    alert(
        "El pago fue deshecho correctamente."
    );

}

// ======================================
// ELIMINAR DEUDA
// ======================================

function eliminarDeuda(id) {

    const deuda =
        deudas.find(
            deuda => deuda.id === id
        );


    if (!deuda) {
        return;
    }


    const confirmar =
        confirm(
            "¿Eliminar la deuda de " +
            deuda.persona +
            "?"
        );


    if (!confirmar) {
        return;
    }


    deudas =
        deudas.filter(
            deuda => deuda.id !== id
        );


    guardarDeudas();

    actualizarDeudas();

}



// ======================================
// FORMATEAR FECHA
// ======================================

function formatearFechaDeuda(fecha) {

    if (!fecha) {

        return "Sin fecha";

    }


    const partes =
        fecha.split("-");


    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );

}



// CARGAR AL INICIAR

actualizarDeudas();

// ======================================
// SISTEMA DE METAS
// ======================================

const formMeta =
    document.getElementById("formMeta");

const listaMetas =
    document.getElementById("listaMetas");

const totalAhorradoMetasTexto =
    document.getElementById(
        "totalAhorradoMetas"
    );

const totalObjetivosMetasTexto =
    document.getElementById(
        "totalObjetivosMetas"
    );

const totalFaltaMetasTexto =
    document.getElementById(
        "totalFaltaMetas"
    );

const ahorroInicioTexto =
    document.getElementById(
        "ahorroInicio"
    );



// ======================================
// CREAR META
// ======================================

formMeta.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const nombre =
            document.getElementById(
                "nombreMeta"
            ).value.trim();


        const objetivo =
            Number(
                document.getElementById(
                    "objetivoMeta"
                ).value
            );


        const fecha =
            document.getElementById(
                "fechaMeta"
            ).value;


        if (
            !nombre ||
            objetivo <= 0
        ) {

            return;

        }


        const nuevaMeta = {

            id: Date.now(),

            nombre: nombre,

            objetivo: objetivo,

            fechaObjetivo: fecha,

            aportes: [],

            fechaCreacion:
                new Date().toISOString()

        };


        metas.push(nuevaMeta);


        guardarMetas();

        actualizarMetas();

        actualizarPantalla();


        formMeta.reset();

    }
);



// ======================================
// GUARDAR
// ======================================

function guardarMetas() {

    localStorage.setItem(
        "metas",
        JSON.stringify(metas)
    );

}



// ======================================
// TOTAL AHORRADO
// ======================================

function obtenerAhorroReservado() {

    let total = 0;


    metas.forEach(meta => {

        if (!Array.isArray(meta.aportes)) {
            return;
        }


        meta.aportes.forEach(aporte => {

            total += Number(
                aporte.monto
            );

        });

    });


    return total;

}



// ======================================
// TOTAL DE UNA META
// ======================================

function obtenerAhorradoMeta(meta) {

    if (!Array.isArray(meta.aportes)) {

        return 0;

    }


    return meta.aportes.reduce(
        (total, aporte) =>
            total +
            Number(aporte.monto),
        0
    );

}



// ======================================
// ACTUALIZAR
// ======================================

function actualizarMetas() {

    calcularResumenMetas();

    mostrarMetas();

}



// ======================================
// RESUMEN
// ======================================

function calcularResumenMetas() {

    let objetivoTotal = 0;

    let ahorradoTotal = 0;


    metas.forEach(meta => {

        objetivoTotal +=
            Number(meta.objetivo);


        ahorradoTotal +=
            obtenerAhorradoMeta(meta);

    });


    const falta =
        Math.max(
            objetivoTotal -
            ahorradoTotal,
            0
        );


    totalAhorradoMetasTexto.textContent =
        dinero(ahorradoTotal);


    totalObjetivosMetasTexto.textContent =
        dinero(objetivoTotal);


    totalFaltaMetasTexto.textContent =
        dinero(falta);


    if (ahorroInicioTexto) {

        ahorroInicioTexto.textContent =
            dinero(ahorradoTotal);

    }

}

// ======================================
// MOSTRAR METAS
// ======================================

function mostrarMetas() {

    listaMetas.innerHTML = "";


    if (metas.length === 0) {

        listaMetas.innerHTML = `

            <p class="vacio">
                Todavía no tienes metas.
            </p>

        `;

        return;

    }


    metas.forEach(meta => {

        const ahorrado =
            obtenerAhorradoMeta(meta);


        const falta =
            Math.max(
                meta.objetivo -
                ahorrado,
                0
            );


        const porcentaje =
            Math.min(
                (
                    ahorrado /
                    meta.objetivo
                ) * 100,
                100
            );


        const completada =
            ahorrado >=
            meta.objetivo;


        let fechaTexto =
            "Sin fecha";


        if (meta.fechaObjetivo) {

            fechaTexto =
                formatearFechaDeuda(
                    meta.fechaObjetivo
                );

        }


        let historialHTML = "";


        if (
            Array.isArray(meta.aportes) &&
            meta.aportes.length > 0
        ) {

            historialHTML = `

                <div
                    class="historial-aportes"
                >

                    <h4>
                        Historial de ahorro
                    </h4>


                    ${
                        [...meta.aportes]

                            .reverse()

                            .map(aporte => {

                                const fecha =
                                    new Date(
                                        aporte.fecha
                                    );


                                return `

                                    <div
                                        class="aporte-item"
                                    >

                                        <small>
                                            ${
                                                fecha
                                                .toLocaleString(
                                                    "es-EC"
                                                )
                                            }
                                        </small>

                                        <strong>
                                            +${dinero(
                                                aporte.monto
                                            )}
                                        </strong>

                                    </div>

                                `;

                            })

                            .join("")
                    }

                </div>

            `;

        }



        const div =
            document.createElement(
                "div"
            );


        div.className =
            "meta-item";


        div.innerHTML = `

            <div class="meta-superior">

                <div>

                    <h3 class="meta-nombre">
                        ${meta.nombre}
                    </h3>

                    <p class="meta-fecha">
                        Fecha objetivo:
                        ${fechaTexto}
                    </p>

                </div>


                <span
                    class="
                        meta-estado
                        ${
                            completada
                            ? "meta-completada"
                            : ""
                        }
                    "
                >

                    ${
                        completada
                        ? "Completada"
                        : "En progreso"
                    }

                </span>

            </div>



            <div class="meta-datos">

                <div class="meta-dato">

                    <small>
                        Objetivo
                    </small>

                    <strong>
                        ${dinero(
                            meta.objetivo
                        )}
                    </strong>

                </div>


                <div class="meta-dato">

                    <small>
                        Ahorrado
                    </small>

                    <strong>
                        ${dinero(
                            ahorrado
                        )}
                    </strong>

                </div>


                <div class="meta-dato">

                    <small>
                        Falta
                    </small>

                    <strong>
                        ${dinero(
                            falta
                        )}
                    </strong>

                </div>

            </div>



            <div class="barra-meta">

                <div
                    class="barra-meta-progreso"
                    style="
                        width:
                        ${porcentaje}%
                    "
                >
                </div>

            </div>


            <div class="porcentaje-meta">

                ${porcentaje.toFixed(1)}%

            </div>


            ${historialHTML}


            <div class="acciones-meta">


                ${
                    !completada
                    ? `

                    <button
                        class="btn-aporte"
                        onclick="
                            registrarAporteMeta(
                                ${meta.id}
                            )
                        "
                    >
                        + Añadir ahorro
                    </button>

                    `
                    : ""
                }


                ${
                    meta.aportes.length > 0
                    ? `

                    <button
                        class="btn-deshacer-aporte"
                        onclick="
                            deshacerUltimoAporte(
                                ${meta.id}
                            )
                        "
                    >
                        ↶ Deshacer aporte
                    </button>

                    `
                    : ""
                }


                <button
                    class="btn-eliminar-meta"
                    onclick="
                        eliminarMeta(
                            ${meta.id}
                        )
                    "
                >
                    Eliminar
                </button>


            </div>

        `;


        listaMetas.appendChild(div);

    });

}

// ======================================
// REGISTRAR APORTE
// ======================================

function registrarAporteMeta(id) {

    const meta =
        metas.find(
            meta => meta.id === id
        );


    if (!meta) {
        return;
    }


    const ahorrado =
        obtenerAhorradoMeta(meta);


    const falta =
        Math.max(
            meta.objetivo -
            ahorrado,
            0
        );


    const respuesta =
        prompt(

            "¿Cuánto deseas reservar?\n\n" +

            "Falta: " +
            dinero(falta)

        );


    if (respuesta === null) {
        return;
    }


    const monto =
        Number(
            respuesta.replace(",", ".")
        );


    if (
        isNaN(monto) ||
        monto <= 0
    ) {

        alert(
            "Ingresa un monto válido."
        );

        return;

    }


    if (monto > falta) {

        alert(
            "El aporte supera el monto " +
            "que falta para completar la meta."
        );

        return;

    }


    meta.aportes.push({

        id: Date.now(),

        monto: monto,

        fecha:
            new Date().toISOString()

    });


    guardarMetas();

    actualizarMetas();

    actualizarPantalla();


    alert(
        "Ahorro reservado correctamente."
    );

}

// ======================================
// DESHACER ÚLTIMO APORTE
// ======================================

function deshacerUltimoAporte(id) {

    const meta =
        metas.find(
            meta => meta.id === id
        );


    if (
        !meta ||
        !Array.isArray(meta.aportes) ||
        meta.aportes.length === 0
    ) {

        return;

    }


    const ultimo =
        meta.aportes[
            meta.aportes.length - 1
        ];


    const confirmar =
        confirm(

            "¿Liberar este ahorro?\n\n" +

            "Monto: " +
            dinero(ultimo.monto)

        );


    if (!confirmar) {
        return;
    }


    meta.aportes.pop();


    guardarMetas();

    actualizarMetas();

    actualizarPantalla();

}

// ======================================
// ELIMINAR META
// ======================================

function eliminarMeta(id) {

    const meta =
        metas.find(
            meta => meta.id === id
        );


    if (!meta) {
        return;
    }


    const ahorrado =
        obtenerAhorradoMeta(meta);


    let mensaje =
        "¿Eliminar la meta " +
        meta.nombre +
        "?";


    if (ahorrado > 0) {

        mensaje +=

            "\n\nSe liberarán " +

            dinero(ahorrado) +

            " que estaban reservados.";

    }


    const confirmar =
        confirm(mensaje);


    if (!confirmar) {
        return;
    }


    metas =
        metas.filter(
            meta => meta.id !== id
        );


    guardarMetas();

    actualizarMetas();

    actualizarPantalla();

}

actualizarMetas();

// ======================================
// SISTEMA DE PRESUPUESTOS
// ======================================

const formPresupuesto =
    document.getElementById(
        "formPresupuesto"
    );

const listaPresupuestos =
    document.getElementById(
        "listaPresupuestos"
    );

const gastoMesTexto =
    document.getElementById(
        "gastoMes"
    );

const presupuestoTotalTexto =
    document.getElementById(
        "presupuestoTotal"
    );

const presupuestoDisponibleTexto =
    document.getElementById(
        "presupuestoDisponible"
    );

const gastoDiarioTexto =
    document.getElementById(
        "gastoDiario"
    );

const nombreMesPresupuestoTexto =
    document.getElementById(
        "nombreMesPresupuesto"
    );

formPresupuesto.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const categoria =
            document.getElementById(
                "categoriaPresupuesto"
            ).value;


        const limite =
            Number(
                document.getElementById(
                    "limitePresupuesto"
                ).value
            );


        if (
            isNaN(limite) ||
            limite < 0
        ) {

            alert(
                "Ingresa un presupuesto válido."
            );

            return;

        }


        presupuestos[categoria] =
            limite;


        guardarPresupuestos();


        actualizarPresupuestos();


        formPresupuesto.reset();

    }
);

function guardarPresupuestos() {

    const clave =
        obtenerClaveMesActual();


    presupuestosPorMes[clave] =
        presupuestos;


    localStorage.setItem(

        "presupuestosPorMes",

        JSON.stringify(
            presupuestosPorMes
        )

    );

}

function obtenerGastosMesActual() {

    const ahora =
        new Date();


    const mesActual =
        ahora.getMonth();


    const anioActual =
        ahora.getFullYear();


    return movimientos.filter(
        movimiento => {

            if (
                movimiento.tipo !==
                "gasto"
            ) {

                return false;

            }


            const fecha =
                obtenerFechaMovimiento(
                    movimiento
                );


            if (!fecha) {

                return false;

            }


            return (

                fecha.getMonth() ===
                    mesActual

                &&

                fecha.getFullYear() ===
                    anioActual

            );

        }
    );

}

function obtenerFechaMovimiento(
    movimiento
) {

    // =================================
    // MOVIMIENTOS NUEVOS
    // =================================

    if (movimiento.fechaISO) {

        const fecha =
            new Date(
                movimiento.fechaISO
            );


        if (!isNaN(fecha.getTime())) {

            return fecha;

        }

    }


    // =================================
    // MOVIMIENTOS ANTIGUOS
    // =================================

    if (
        typeof movimiento.fecha ===
        "string"
    ) {

        /*
        Ejemplo:

        12/8/2026, 18:15:22
        */

        const coincidencia =
            movimiento.fecha.match(
                /(\d{1,2})\/(\d{1,2})\/(\d{4})/
            );


        if (coincidencia) {

            const dia =
                Number(
                    coincidencia[1]
                );


            const mes =
                Number(
                    coincidencia[2]
                ) - 1;


            const anio =
                Number(
                    coincidencia[3]
                );


            return new Date(
                anio,
                mes,
                dia
            );

        }

    }


    return null;

}

function obtenerGastoCategoria(
    categoria
) {

    const gastos =
        obtenerGastosMesActual();


    return gastos

        .filter(
            movimiento =>
                movimiento.categoria ===
                categoria
        )

        .reduce(
            (total, movimiento) =>
                total +
                Number(
                    movimiento.monto
                ),
            0
        );

}

function actualizarPresupuestos() {

    mostrarResumenPresupuesto();

    mostrarListaPresupuestos();

}

function mostrarResumenPresupuesto() {

    const gastosMes =
        obtenerGastosMesActual();


    const totalGastado =
        gastosMes.reduce(
            (total, movimiento) =>
                total +
                Number(
                    movimiento.monto
                ),
            0
        );


    const presupuestoTotal =
        Object.values(
            presupuestos
        ).reduce(
            (total, valor) =>
                total +
                Number(valor),
            0
        );


    const disponiblePresupuesto =
        presupuestoTotal -
        totalGastado;


    gastoMesTexto.textContent =
        dinero(totalGastado);


    presupuestoTotalTexto.textContent =
        dinero(
            presupuestoTotal
        );


    presupuestoDisponibleTexto.textContent =
        dinero(
            disponiblePresupuesto
        );


    calcularGastoDiario();

}

function calcularGastoDiario() {

    const ahora =
        new Date();


    const ultimoDia =
        new Date(

            ahora.getFullYear(),

            ahora.getMonth() + 1,

            0

        ).getDate();


    const diaActual =
        ahora.getDate();


    const diasRestantes =
        ultimoDia -
        diaActual +
        1;


    // Saldo financiero real

    let ingresos = 0;

    let gastos = 0;


    movimientos.forEach(
        movimiento => {

            if (
                movimiento.tipo ===
                "ingreso"
            ) {

                ingresos +=
                    Number(
                        movimiento.monto
                    );

            } else {

                gastos +=
                    Number(
                        movimiento.monto
                    );

            }

        }
    );


    const saldoReal =
        ingresos -
        gastos;


    const ahorroReservado =
        obtenerAhorroReservado();


    const disponible =
        Math.max(
            saldoReal -
            ahorroReservado,
            0
        );


    const diario =
        diasRestantes > 0

            ? disponible /
                diasRestantes

            : 0;


    gastoDiarioTexto.textContent =
        dinero(diario);

}

function mostrarListaPresupuestos() {

    listaPresupuestos.innerHTML =
        "";


    const categorias = [

        "Comida",

        "Transporte",

        "Universidad",

        "Entretenimiento",

        "Servicios",

        "Deudas",

        "Otros"

    ];


    categorias.forEach(
        categoria => {


            const gastado =
                obtenerGastoCategoria(
                    categoria
                );


            const limite =
                Number(
                    presupuestos[
                        categoria
                    ] || 0
                );


            let porcentaje = 0;


            if (limite > 0) {

                porcentaje =
                    (
                        gastado /
                        limite
                    ) * 100;

            }


            const porcentajeBarra =
                Math.min(
                    porcentaje,
                    100
                );


            const disponible =
                limite -
                gastado;


            let alertaHTML = "";


            if (
                limite > 0 &&
                porcentaje >= 100
            ) {

                alertaHTML = `

                    <div
                        class="
                            presupuesto-alerta
                            alerta-superado
                        "
                    >

                        ⚠️ Superaste tu presupuesto
                        por
                        ${dinero(
                            Math.abs(
                                disponible
                            )
                        )}

                    </div>

                `;

            }


            else if (
                limite > 0 &&
                porcentaje >= 80
            ) {

                alertaHTML = `

                    <div
                        class="
                            presupuesto-alerta
                            alerta-cerca
                        "
                    >

                        ⚠️ Ya utilizaste
                        ${porcentaje.toFixed(0)}%
                        del presupuesto.

                    </div>

                `;

            }


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "presupuesto-item";


            div.innerHTML = `

                <div
                    class="
                        presupuesto-superior
                    "
                >

                    <h3>
                        ${categoria}
                    </h3>


                    <div
                        class="
                            presupuesto-valores
                        "
                    >

                        <strong>
                            ${dinero(
                                gastado
                            )}
                        </strong>


                        ${
                            limite > 0
                            ? `

                                <small>

                                    de
                                    ${dinero(
                                        limite
                                    )}

                                </small>

                            `
                            : `

                                <small>
                                    Sin límite
                                </small>

                            `
                        }

                    </div>

                </div>


                ${
                    limite > 0
                    ? `

                    <div
                        class="
                            barra-presupuesto
                        "
                    >

                        <div

                            class="
                                barra-presupuesto-progreso
                            "

                            style="
                                width:
                                ${porcentajeBarra}%
                            "

                        >
                        </div>

                    </div>


                    <div
                        class="
                            presupuesto-detalle
                        "
                    >

                        <span>
                            ${porcentaje.toFixed(1)}%
                        </span>


                        <span>

                            ${
                                disponible >= 0
                                ? "Disponible: "
                                : "Exceso: "
                            }

                            ${dinero(
                                Math.abs(
                                    disponible
                                )
                            )}

                        </span>

                    </div>

                    `
                    : `

                    <p
                        class="
                            sin-presupuesto
                        "
                    >

                        Has gastado
                        ${dinero(
                            gastado
                        )},
                        pero todavía no has
                        definido un límite.

                    </p>

                    `
                }


                ${alertaHTML}

            `;


            listaPresupuestos
                .appendChild(div);

        }
    );

}

function mostrarNombreMes() {

    const ahora =
        new Date();


    const nombreMes =
        ahora.toLocaleDateString(
            "es-EC",
            {
                month: "long",
                year: "numeric"
            }
        );


    nombreMesPresupuestoTexto
        .textContent =
            nombreMes
                .charAt(0)
                .toUpperCase()
            +
            nombreMes.slice(1);

}

mostrarNombreMes();

actualizarPresupuestos();


// Solo ejecutar si el formulario existe

if (formPresupuesto) {

    formPresupuesto.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const categoria =
                document.getElementById(
                    "categoriaPresupuesto"
                ).value;


            const limite =
                Number(
                    document.getElementById(
                        "limitePresupuesto"
                    ).value
                );


            if (
                isNaN(limite) ||
                limite < 0
            ) {

                alert(
                    "Ingresa un monto válido."
                );

                return;

            }


            // Guardar límite

            presupuestos[categoria] =
                limite;


            guardarPresupuestos();


            mostrarPresupuestosBasicos();


            // Vaciar solo el monto

            document.getElementById(
                "limitePresupuesto"
            ).value = "";

        }
    );

}

function mostrarPresupuestosBasicos() {

    if (!listaPresupuestos) {
        return;
    }

    presupuestos =
        obtenerPresupuestosMesActual();

    listaPresupuestos.innerHTML = "";


    const categorias =
        Object.keys(presupuestos);


    if (categorias.length === 0) {

        listaPresupuestos.innerHTML = `

            <p class="vacio">

                Todavía no has definido
                presupuestos.

            </p>

        `;

        return;

    }


    categorias.forEach(categoria => {

        const limite =
            Number(
                presupuestos[categoria]
            );


        const gastado =
            obtenerGastoCategoria(
                categoria
            );


        const disponible =
            limite - gastado;


        let porcentaje = 0;


        if (limite > 0) {

            porcentaje =
                (gastado / limite) * 100;

        }


        const porcentajeBarra =
            Math.min(
                porcentaje,
                100
            );


        let alerta = "";


        if (porcentaje >= 100) {

            alerta = `

                <div
                    class="
                        presupuesto-alerta
                        alerta-superado
                    "
                >

                    ⚠️ Presupuesto superado por
                    ${dinero(
                        Math.abs(disponible)
                    )}

                </div>

            `;

        }


        else if (porcentaje >= 80) {

            alerta = `

                <div
                    class="
                        presupuesto-alerta
                        alerta-cerca
                    "
                >

                    ⚠️ Ya utilizaste
                    ${porcentaje.toFixed(0)}%
                    de este presupuesto.

                </div>

            `;

        }


        const div =
            document.createElement(
                "div"
            );


        div.className =
            "presupuesto-item";


        div.innerHTML = `

            <div
                class="
                    presupuesto-superior
                "
            >

                <div>

                    <h3>
                        ${categoria}
                    </h3>

                </div>


                <div
                    class="
                        presupuesto-valores
                    "
                >

                    <strong>

                        ${dinero(gastado)}
                        /
                        ${dinero(limite)}

                    </strong>

                </div>

            </div>


            <div
                class="
                    barra-presupuesto
                "
            >

                <div

                    class="
                        barra-presupuesto-progreso
                    "

                    style="
                        width:
                        ${porcentajeBarra}%
                    "

                >
                </div>

            </div>


            <div
                class="
                    presupuesto-detalle
                "
            >

                <span>

                    ${porcentaje.toFixed(1)}%

                </span>


                <span>

                    ${
                        disponible >= 0
                        ? "Disponible: "
                        : "Exceso: "
                    }

                    ${dinero(
                        Math.abs(disponible)
                    )}

                </span>

            </div>


            ${alerta}

        `;


        listaPresupuestos
            .appendChild(div);

    });

    actualizarResumenPresupuesto();
}

mostrarPresupuestosBasicos();

// ======================================
// GASTO POR CATEGORÍA
// ======================================

function obtenerGastoCategoria(categoria) {

    const ahora = new Date();

    let total = 0;


    movimientos.forEach(movimiento => {

        if (movimiento.tipo !== "gasto") {
            return;
        }


        if (movimiento.categoria !== categoria) {
            return;
        }


        const fecha =
            obtenerFechaMovimiento(
                movimiento
            );


        if (!fecha) {
            return;
        }


        const mismoMes =
            fecha.getMonth() ===
            ahora.getMonth();


        const mismoAnio =
            fecha.getFullYear() ===
            ahora.getFullYear();


        if (
            mismoMes &&
            mismoAnio
        ) {

            total += Number(
                movimiento.monto
            );

        }

    });


    return total;

}

function actualizarNombreMes() {

    const elemento =
        document.getElementById(
            "nombreMesPresupuesto"
        );


    if (!elemento) {
        return;
    }


    const ahora =
        new Date();


    const texto =
        ahora.toLocaleDateString(
            "es-EC",
            {
                month: "long",
                year: "numeric"
            }
        );


    elemento.textContent =
        texto.charAt(0)
            .toUpperCase()
        +
        texto.slice(1);

}

actualizarNombreMes();

function calcularDisponibleGeneral() {

    let ingresos = 0;

    let gastos = 0;


    movimientos.forEach(
        movimiento => {

            const monto =
                Number(
                    movimiento.monto
                );


            if (
                movimiento.tipo ===
                "ingreso"
            ) {

                ingresos += monto;

            }


            if (
                movimiento.tipo ===
                "gasto"
            ) {

                gastos += monto;

            }

        }
    );


    const ahorroReservado =
        obtenerAhorroReservado();


    return (
        ingresos -
        gastos -
        ahorroReservado
    );

}

function obtenerDiasRestantesMes() {

    const hoy =
        new Date();


    const ultimoDia =
        new Date(

            hoy.getFullYear(),

            hoy.getMonth() + 1,

            0

        ).getDate();


    return (
        ultimoDia -
        hoy.getDate() +
        1
    );

}

function calcularDisponibleDiario() {

    const disponible =
        calcularDisponibleGeneral();


    const dias =
        obtenerDiasRestantesMes();


    if (
        dias <= 0 ||
        disponible <= 0
    ) {

        return 0;

    }


    return disponible / dias;

}

function actualizarGastoDiario() {

    const elemento =
        document.getElementById(
            "gastoDiario"
        );


    if (!elemento) {
        return;
    }


    const diario =
        calcularDisponibleDiario();


    elemento.textContent =
        dinero(diario);

}

function actualizarResumenPresupuesto() {

    presupuestos =
        obtenerPresupuestosMesActual();


    // ==========================
    // TOTAL GASTADO DEL MES
    // ==========================

    const ahora =
        new Date();


    let gastoMes = 0;


    movimientos.forEach(
        movimiento => {

            if (
                movimiento.tipo !==
                "gasto"
            ) {
                return;
            }


            const fecha =
                obtenerFechaMovimiento(
                    movimiento
                );


            if (!fecha) {
                return;
            }


            if (
                fecha.getMonth() ===
                    ahora.getMonth()
                &&
                fecha.getFullYear() ===
                    ahora.getFullYear()
            ) {

                gastoMes +=
                    Number(
                        movimiento.monto
                    );

            }

        }
    );


    // ==========================
    // PRESUPUESTO TOTAL
    // ==========================

    const totalPresupuesto =
        Object.values(
            presupuestos
        ).reduce(

            (total, valor) =>
                total +
                Number(valor),

            0

        );


    // Gastos solo de categorías
    // que tienen presupuesto

    let gastoPresupuestado = 0;


    Object.keys(
        presupuestos
    ).forEach(
        categoria => {

            gastoPresupuestado +=
                obtenerGastoCategoria(
                    categoria
                );

        }
    );


    const disponible =
        totalPresupuesto -
        gastoPresupuestado;


    // ==========================
    // HTML
    // ==========================

    const gastoMesElemento =
        document.getElementById(
            "gastoMes"
        );


    const totalElemento =
        document.getElementById(
            "presupuestoTotal"
        );


    const disponibleElemento =
        document.getElementById(
            "presupuestoDisponible"
        );


    if (gastoMesElemento) {

        gastoMesElemento.textContent =
            dinero(gastoMes);

    }


    if (totalElemento) {

        totalElemento.textContent =
            dinero(totalPresupuesto);

    }


    if (disponibleElemento) {

        disponibleElemento.textContent =
            dinero(disponible);

    }


    actualizarGastoDiario();

}

// ======================================
// RESUMEN FINANCIERO PARA IA LOCAL
// ======================================

function obtenerDatosAsesorLocal() {

    let ingresos = 0;
    let gastos = 0;


    movimientos.forEach(
        movimiento => {

            const monto =
                Number(
                    movimiento.monto
                ) || 0;


            if (
                movimiento.tipo ===
                "ingreso"
            ) {

                ingresos += monto;

            }


            if (
                movimiento.tipo ===
                "gasto"
            ) {

                gastos += monto;

            }

        }
    );


    // Ahorro reservado

    const ahorroReservado =
        typeof obtenerAhorroReservado ===
        "function"

            ? obtenerAhorroReservado()

            : 0;


    // Dinero verdaderamente libre

    const disponibleReal =
        ingresos -
        gastos -
        ahorroReservado;


    // ==========================
    // DEUDAS
    // ==========================

    let yoDebo = 0;

    let meDeben = 0;


    deudas.forEach(
        deuda => {

            const pendiente =
                Math.max(

                    Number(
                        deuda.montoOriginal
                    ) -

                    Number(
                        deuda.pagado
                    ),

                    0

                );


            if (
                deuda.tipo ===
                "yo_debo"
            ) {

                yoDebo += pendiente;

            }


            if (
                deuda.tipo ===
                "me_deben"
            ) {

                meDeben += pendiente;

            }

        }
    );


    // ==========================
    // PRESUPUESTO
    // ==========================

    const presupuestoActual =
        typeof obtenerPresupuestosMesActual
        === "function"

            ? obtenerPresupuestosMesActual()

            : {};


    const totalPresupuesto =
        Object.values(
            presupuestoActual
        ).reduce(

            (total, valor) =>
                total +
                Number(valor),

            0

        );


    let gastoPresupuestado = 0;


    Object.keys(
        presupuestoActual
    ).forEach(
        categoria => {

            if (
                typeof obtenerGastoCategoria
                === "function"
            ) {

                gastoPresupuestado +=
                    obtenerGastoCategoria(
                        categoria
                    );

            }

        }
    );


    const disponiblePresupuesto =
        totalPresupuesto -
        gastoPresupuestado;


    // ==========================
    // DIARIO
    // ==========================

    const diasRestantes =
        typeof obtenerDiasRestantesMes
        === "function"

            ? obtenerDiasRestantesMes()

            : 1;


    const disponibleDiario =
        disponibleReal > 0 &&
        diasRestantes > 0

            ? disponibleReal /
                diasRestantes

            : 0;


    return {

        ingresos,

        gastos,

        ahorroReservado,

        disponibleReal,

        yoDebo,

        meDeben,

        balanceDeudas:
            meDeben - yoDebo,

        totalPresupuesto,

        gastoPresupuestado,

        disponiblePresupuesto,

        diasRestantes,

        disponibleDiario

    };

}

// ======================================
// MAYOR CATEGORÍA DE GASTO DEL MES
// ======================================

function obtenerMayorCategoriaGastoIA() {

    const categorias = {};

    const ahora =
        new Date();


    movimientos.forEach(
        movimiento => {

            if (
                movimiento.tipo !==
                "gasto"
            ) {

                return;

            }


            const fecha =
                obtenerFechaMovimiento(
                    movimiento
                );


            if (!fecha) {
                return;
            }


            if (
                fecha.getMonth() !==
                    ahora.getMonth()
                ||
                fecha.getFullYear() !==
                    ahora.getFullYear()
            ) {

                return;

            }


            const categoria =
                movimiento.categoria ||
                "Otros";


            if (!categorias[categoria]) {

                categorias[categoria] = 0;

            }


            categorias[categoria] +=
                Number(
                    movimiento.monto
                );

        }
    );


    const lista =
        Object.entries(
            categorias
        );


    if (lista.length === 0) {

        return null;

    }


    lista.sort(
        (a, b) =>
            b[1] - a[1]
    );


    return {

        categoria:
            lista[0][0],

        monto:
            lista[0][1]

    };

}

// ======================================
// MOTOR DE RECOMENDACIONES
// ======================================

function generarConsejosFinancierosLocal() {

    const datos =
        obtenerDatosAsesorLocal();


    const consejos = [];


    // ==========================
    // DINERO DISPONIBLE
    // ==========================

    if (
        datos.disponibleReal < 0
    ) {

        consejos.push(
            "🚨 Tus gastos y ahorros reservados " +
            "superan actualmente tus ingresos."
        );

    }

    else if (
        datos.disponibleReal === 0
    ) {

        consejos.push(
            "⚠️ Actualmente no tienes dinero " +
            "libre para nuevos gastos."
        );

    }

    else {

        consejos.push(

            "💰 Tienes " +

            dinero(
                datos.disponibleReal
            ) +

            " disponibles para gastar."

        );

    }


    // ==========================
    // PRESUPUESTO
    // ==========================

    if (
        datos.totalPresupuesto > 0
    ) {

        if (
            datos.disponiblePresupuesto < 0
        ) {

            consejos.push(

                "🚨 Has superado tus presupuestos " +
                "configurados por " +

                dinero(
                    Math.abs(
                        datos.disponiblePresupuesto
                    )
                ) +

                "."

            );

        }

        else {

            consejos.push(

                "📊 Todavía tienes " +

                dinero(
                    datos.disponiblePresupuesto
                ) +

                " dentro de tus límites " +
                "presupuestados."

            );

        }

    }


    // ==========================
    // DISPONIBLE DIARIO
    // ==========================

    if (
        datos.disponibleDiario > 0
    ) {

        consejos.push(

            "📅 Quedan " +

            datos.diasRestantes +

            " días del mes. " +

            "Como referencia podrías usar " +

            dinero(
                datos.disponibleDiario
            ) +

            " por día."

        );

    }


    // ==========================
    // MAYOR GASTO
    // ==========================

    const mayor =
        obtenerMayorCategoriaGastoIA();


    if (mayor) {

        consejos.push(

            "🔎 Tu categoría con mayor gasto " +
            "este mes es " +

            mayor.categoria +

            " con " +

            dinero(
                mayor.monto
            ) +

            "."

        );

    }


    // ==========================
    // DEUDAS
    // ==========================

    if (
        datos.yoDebo > 0
    ) {

        consejos.push(

            "💳 Tienes " +

            dinero(
                datos.yoDebo
            ) +

            " pendientes en deudas."

        );

    }


    if (
        datos.meDeben > 0
    ) {

        consejos.push(

            "💵 Tienes " +

            dinero(
                datos.meDeben
            ) +

            " pendientes por cobrar."

        );

    }


    // ==========================
    // AHORRO
    // ==========================

    if (
        datos.ahorroReservado > 0
    ) {

        consejos.push(

            "🎯 Has reservado " +

            dinero(
                datos.ahorroReservado
            ) +

            " para tus metas. " +
            "Ese dinero no se está contando " +
            "como disponible para gastar."

        );

    }


    return consejos;

}

// ======================================
// MOSTRAR MENSAJE EN CHAT
// ======================================

function agregarMensajeIA(
    texto,
    tipo = "ia"
) {

    const chat =
        document.getElementById(
            "chatIA"
        );


    if (!chat) {
        return;
    }


    const mensaje =
        document.createElement(
            "div"
        );


    if (tipo === "usuario") {

        mensaje.className =
            "mensaje-usuario";

    }

    else {

        mensaje.className =
            "mensaje-ia";

    }


    mensaje.textContent =
        texto;


    chat.appendChild(
        mensaje
    );


    chat.scrollTop =
        chat.scrollHeight;

}

// ======================================
// RESPUESTAS DEL ASESOR LOCAL
// ======================================

function responderAsesorLocal(
    pregunta
) {

    const texto =
        pregunta
            .toLowerCase()
            .trim();


    const datos =
        obtenerDatosAsesorLocal();


    // ==========================
    // DISPONIBLE
    // ==========================

    if (
        texto.includes("disponible") ||
        texto.includes("puedo gastar") ||
        texto.includes("cuanto gastar") ||
        texto.includes("cuánto gastar")
    ) {

        return (

            "Tienes " +

            dinero(
                datos.disponibleReal
            ) +

            " realmente disponibles para gastar. " +

            "Quedan " +

            datos.diasRestantes +

            " días del mes y tu referencia diaria " +

            "es aproximadamente " +

            dinero(
                datos.disponibleDiario
            ) +

            "."

        );

    }


    // ==========================
    // PRESUPUESTO
    // ==========================

    if (
        texto.includes("presupuesto")
    ) {

        return (

            "Tu presupuesto total configurado " +
            "para este mes es " +

            dinero(
                datos.totalPresupuesto
            ) +

            ". Has consumido " +

            dinero(
                datos.gastoPresupuestado
            ) +

            " y todavía tienes " +

            dinero(
                datos.disponiblePresupuesto
            ) +

            " dentro de esos límites."

        );

    }


    // ==========================
    // DEUDAS
    // ==========================

    if (
        texto.includes("deuda") ||
        texto.includes("debo")
    ) {

        return (

            "Actualmente debes " +

            dinero(
                datos.yoDebo
            ) +

            ". Otras personas te deben " +

            dinero(
                datos.meDeben
            ) +

            ". Tu balance de deudas es " +

            dinero(
                datos.balanceDeudas
            ) +

            "."

        );

    }


    // ==========================
    // AHORRO / METAS
    // ==========================

    if (
        texto.includes("ahorro") ||
        texto.includes("meta")
    ) {

        return (

            "Actualmente tienes " +

            dinero(
                datos.ahorroReservado
            ) +

            " reservados para tus metas. " +

            "Ese dinero sigue siendo tuyo, " +
            "pero no se considera disponible " +
            "para gastos cotidianos."

        );

    }


    // ==========================
    // GASTOS
    // ==========================

    if (
        texto.includes("gasto")
    ) {

        const mayor =
            obtenerMayorCategoriaGastoIA();


        if (!mayor) {

            return (
                "Todavía no tengo suficientes " +
                "gastos del mes para analizarlos."
            );

        }


        return (

            "La categoría donde más has gastado " +
            "este mes es " +

            mayor.categoria +

            " con " +

            dinero(
                mayor.monto
            ) +

            "."

        );

    }


    // ==========================
    // CONSEJOS
    // ==========================

    if (
        texto.includes("consejo") ||
        texto.includes("recomend")
    ) {

        return generarConsejosFinancierosLocal()
            .join("\n\n");

    }


    // ==========================
    // RESUMEN
    // ==========================

    if (
        texto.includes("resumen")
    ) {

        return (

            "Resumen financiero:\n\n" +

            "Ingresos: " +
            dinero(datos.ingresos) +

            "\nGastos: " +
            dinero(datos.gastos) +

            "\nAhorro reservado: " +
            dinero(
                datos.ahorroReservado
            ) +

            "\nDisponible para gastar: " +
            dinero(
                datos.disponibleReal
            ) +

            "\nYo debo: " +
            dinero(datos.yoDebo) +

            "\nMe deben: " +
            dinero(datos.meDeben)

        );

    }


    return (
        "Todavía soy un asesor local sencillo. " +
        "Puedes preguntarme por gastos, presupuesto, " +
        "deudas, ahorro, metas o cuánto puedes gastar."
    );

}

// ======================================
// CHAT IA LOCAL
// ======================================

const inputIALocal =
    document.getElementById(
        "inputIA"
    );

const botonIALocal =
    document.getElementById(
        "btnEnviarIA"
    );


function enviarPreguntaIA() {

    actualizarPanelSaludLocal();

    if (!inputIALocal) {
        return;
    }


    const pregunta =
        inputIALocal.value.trim();


    if (!pregunta) {
        return;
    }


    agregarMensajeIA(
        pregunta,
        "usuario"
    );


    const respuesta =
        responderAsesorLocal(
            pregunta
        );


    agregarMensajeIA(
        respuesta,
        "ia"
    );


    inputIALocal.value = "";

}


if (botonIALocal) {

    botonIALocal.addEventListener(
        "click",
        enviarPreguntaIA
    );

}


if (inputIALocal) {

    inputIALocal.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                enviarPreguntaIA();

            }

        }
    );

}

document
    .querySelectorAll(
        ".preguntas-rapidas button"
    )
    .forEach(
        boton => {

            boton.addEventListener(
                "click",
                function() {

                    const pregunta =
                        boton.dataset.pregunta;


                    agregarMensajeIA(
                        pregunta,
                        "usuario"
                    );


                    agregarMensajeIA(

                        responderAsesorLocal(
                            pregunta
                        ),

                        "ia"

                    );

                }
            );

        }
    );

// ======================================
// PUNTAJE DE SALUD FINANCIERA
// ======================================

function calcularPuntajeSaludLocal() {

    const datos =
        obtenerDatosAsesorLocal();


    let puntaje = 100;


    // ==========================
    // DINERO DISPONIBLE
    // ==========================

    if (
        datos.disponibleReal < 0
    ) {

        puntaje -= 35;

    }

    else if (
        datos.disponibleReal === 0
    ) {

        puntaje -= 20;

    }


    // ==========================
    // PRESUPUESTO
    // ==========================

    if (
        datos.totalPresupuesto > 0
    ) {

        if (
            datos.disponiblePresupuesto < 0
        ) {

            puntaje -= 25;

        }

    }


    // ==========================
    // DEUDAS
    // ==========================

    if (
        datos.yoDebo > 0
    ) {

        // Penalización básica

        puntaje -= 8;


        // Si las deudas superan
        // el dinero disponible + cobros

        const respaldo =
            Math.max(
                datos.disponibleReal,
                0
            )
            +
            datos.meDeben;


        if (
            datos.yoDebo >
            respaldo
        ) {

            puntaje -= 12;

        }

    }


    // ==========================
    // AHORRO
    // ==========================

    if (
        datos.ahorroReservado > 0
    ) {

        puntaje += 5;

    }


    // Nunca superar 100

    puntaje =
        Math.min(
            puntaje,
            100
        );


    // Nunca menor a 0

    puntaje =
        Math.max(
            puntaje,
            0
        );


    return Math.round(
        puntaje
    );

}   

function obtenerEstadoSaludLocal(
    puntaje
) {

    if (puntaje >= 85) {

        return {

            texto:
                "Excelente",

            icono:
                "🟢"

        };

    }


    if (puntaje >= 70) {

        return {

            texto:
                "Buena",

            icono:
                "🟢"

        };

    }


    if (puntaje >= 50) {

        return {

            texto:
                "Atención",

            icono:
                "🟡"

        };

    }


    if (puntaje >= 30) {

        return {

            texto:
                "Riesgo",

            icono:
                "🟠"

        };

    }


    return {

        texto:
            "Crítica",

        icono:
            "🔴"

    };

}

// ======================================
// ALERTAS POR CATEGORÍA
// ======================================

function analizarCategoriasPresupuestoLocal() {

    const actual =
        obtenerPresupuestosMesActual();


    const resultados = [];


    Object.keys(actual).forEach(
        categoria => {

            const limite =
                Number(
                    actual[categoria]
                );


            if (limite <= 0) {
                return;
            }


            const gastado =
                obtenerGastoCategoria(
                    categoria
                );


            const porcentaje =
                (
                    gastado /
                    limite
                ) * 100;


            resultados.push({

                categoria:

                    categoria,

                limite:

                    limite,

                gastado:

                    gastado,

                porcentaje:

                    porcentaje,

                disponible:

                    limite -
                    gastado

            });

        }
    );


    return resultados;

}

// ======================================
// GENERAR ALERTAS AUTOMÁTICAS
// ======================================

function generarAlertasFinancierasLocal() {

    const datos =
        obtenerDatosAsesorLocal();


    const alertas = [];


    // ==========================
    // DISPONIBLE REAL
    // ==========================

    if (
        datos.disponibleReal < 0
    ) {

        alertas.push({

            tipo:
                "peligro",

            texto:

                "🚨 Estás utilizando más dinero " +
                "del que tienes disponible. " +

                "El déficit actual es " +

                dinero(
                    Math.abs(
                        datos.disponibleReal
                    )
                ) +

                "."

        });

    }


    else if (
        datos.disponibleReal === 0
    ) {

        alertas.push({

            tipo:
                "aviso",

            texto:

                "⚠️ Actualmente no tienes " +
                "dinero libre para nuevos gastos."

        });

    }


    else {

        alertas.push({

            tipo:
                "bien",

            texto:

                "✅ Tienes " +

                dinero(
                    datos.disponibleReal
                ) +

                " realmente disponibles " +
                "para gastar."

        });

    }


    // ==========================
    // PRESUPUESTOS
    // ==========================

    const categorias =
        analizarCategoriasPresupuestoLocal();


    categorias.forEach(
        categoria => {

            if (
                categoria.porcentaje >= 100
            ) {

                alertas.push({

                    tipo:
                        "peligro",

                    texto:

                        "🚨 " +

                        categoria.categoria +

                        " superó el presupuesto. " +

                        "Exceso: " +

                        dinero(
                            Math.abs(
                                categoria.disponible
                            )
                        ) +

                        "."

                });

            }


            else if (
                categoria.porcentaje >= 80
            ) {

                alertas.push({

                    tipo:
                        "aviso",

                    texto:

                        "⚠️ " +

                        categoria.categoria +

                        " ya utilizó " +

                        categoria
                            .porcentaje
                            .toFixed(0) +

                        "% de su presupuesto."

                });

            }

        }
    );


    // ==========================
    // DEUDAS
    // ==========================

    if (
        datos.yoDebo > 0
    ) {

        alertas.push({

            tipo:
                "info",

            texto:

                "💳 Tienes " +

                dinero(
                    datos.yoDebo
                ) +

                " pendientes por pagar."

        });

    }


    if (
        datos.meDeben > 0
    ) {

        alertas.push({

            tipo:
                "info",

            texto:

                "💵 Tienes " +

                dinero(
                    datos.meDeben
                ) +

                " pendientes por cobrar."

        });

    }


    // ==========================
    // AHORRO
    // ==========================

    if (
        datos.ahorroReservado > 0
    ) {

        alertas.push({

            tipo:
                "bien",

            texto:

                "🎯 Has reservado " +

                dinero(
                    datos.ahorroReservado
                ) +

                " para tus metas."

        });

    }


    // ==========================
    // REFERENCIA DIARIA
    // ==========================

    if (
        datos.disponibleDiario > 0
    ) {

        alertas.push({

            tipo:
                "info",

            texto:

                "📅 Como referencia, puedes " +
                "distribuir aproximadamente " +

                dinero(
                    datos.disponibleDiario
                ) +

                " por día durante los " +

                datos.diasRestantes +

                " días restantes del mes."

        });

    }


    return alertas;

}

// ======================================
// ACTUALIZAR PANEL DE SALUD
// ======================================

function actualizarPanelSaludLocal() {

    const elementoPuntaje =
        document.getElementById(
            "puntajeSalud"
        );


    if (!elementoPuntaje) {
        return;
    }


    const datos =
        obtenerDatosAsesorLocal();


    const puntaje =
        calcularPuntajeSaludLocal();


    const estado =
        obtenerEstadoSaludLocal(
            puntaje
        );


    // PUNTAJE

    elementoPuntaje.textContent =
        puntaje;


    document.getElementById(
        "estadoSalud"
    ).textContent =
        estado.texto;


    document.getElementById(
        "iconoSalud"
    ).textContent =
        estado.icono;


    // ==========================
    // DATOS
    // ==========================

    document.getElementById(
        "saludDisponible"
    ).textContent =
        dinero(
            datos.disponibleReal
        );


    document.getElementById(
        "saludPresupuesto"
    ).textContent =
        dinero(
            datos.disponiblePresupuesto
        );


    document.getElementById(
        "saludDiario"
    ).textContent =
        dinero(
            datos.disponibleDiario
        );


    document.getElementById(
        "saludDeudas"
    ).textContent =
        dinero(
            datos.yoDebo
        );


    // ==========================
    // ALERTAS
    // ==========================

    mostrarAlertasFinancierasLocal();

}

function mostrarAlertasFinancierasLocal() {

    const contenedor =
        document.getElementById(
            "listaAlertasFinancieras"
        );


    if (!contenedor) {
        return;
    }


    const alertas =
        generarAlertasFinancierasLocal();


    contenedor.innerHTML = "";


    if (alertas.length === 0) {

        contenedor.innerHTML = `

            <div
                class="
                    alerta-financiera
                    alerta-bien
                "
            >

                ✅ No se detectaron alertas
                importantes.

            </div>

        `;

        return;

    }


    alertas.forEach(
        alerta => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "alerta-financiera " +
                "alerta-" +
                alerta.tipo;


            div.textContent =
                alerta.texto;


            contenedor.appendChild(
                div
            );

        }
    );

}

const botonPantallaIA =
    document.querySelector(
        '[data-pantalla="ia"]'
    );


if (botonPantallaIA) {

    botonPantallaIA.addEventListener(
        "click",
        function() {

            actualizarPanelSaludLocal();

        }
    );

}

actualizarPanelSaludLocal();

// ======================================
// PLAN MENSUAL
// ======================================

const formRecurrente =
    document.getElementById(
        "formRecurrente"
    );

const listaRecurrentes =
    document.getElementById(
        "listaRecurrentes"
    );


if (formRecurrente) {

    formRecurrente.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const tipo =
                document.getElementById(
                    "tipoRecurrente"
                ).value;


            const nombre =
                document.getElementById(
                    "nombreRecurrente"
                ).value.trim();


            const monto =
                Number(
                    document.getElementById(
                        "montoRecurrente"
                    ).value
                );


            const dia =
                Number(
                    document.getElementById(
                        "diaRecurrente"
                    ).value
                );


            const categoria =
                document.getElementById(
                    "categoriaRecurrente"
                ).value;


            if (
                !nombre ||
                monto <= 0 ||
                dia < 1 ||
                dia > 31
            ) {

                alert(
                    "Revisa los datos ingresados."
                );

                return;

            }


            const nuevo = {

                id: Date.now(),

                tipo: tipo,

                nombre: nombre,

                monto: monto,

                dia: dia,

                categoria: categoria,

                activo: true

            };


            recurrentes.push(
                nuevo
            );


            guardarRecurrentes();

            actualizarRecurrentes();


            formRecurrente.reset();

        }
    );

}

function guardarRecurrentes() {

    localStorage.setItem(

        "recurrentes",

        JSON.stringify(
            recurrentes
        )

    );

}

function obtenerProximaFechaRecurrente(
    dia
) {

    const hoy =
        new Date();


    let anio =
        hoy.getFullYear();

    let mes =
        hoy.getMonth();


    let ultimoDiaMes =
        new Date(
            anio,
            mes + 1,
            0
        ).getDate();


    let diaReal =
        Math.min(
            dia,
            ultimoDiaMes
        );


    let fecha =
        new Date(
            anio,
            mes,
            diaReal
        );


    fecha.setHours(
        0,
        0,
        0,
        0
    );


    const hoySinHora =
        new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            hoy.getDate()
        );


    // Si ya pasó este mes,
    // usar el próximo

    if (
        fecha <
        hoySinHora
    ) {

        mes++;


        if (mes > 11) {

            mes = 0;
            anio++;

        }


        ultimoDiaMes =
            new Date(
                anio,
                mes + 1,
                0
            ).getDate();


        diaReal =
            Math.min(
                dia,
                ultimoDiaMes
            );


        fecha =
            new Date(
                anio,
                mes,
                diaReal
            );

    }


    return fecha;

}

function mostrarRecurrentes() {

    if (!listaRecurrentes) {
        return;
    }


    listaRecurrentes.innerHTML =
        "";


    if (
        recurrentes.length === 0
    ) {

        listaRecurrentes.innerHTML = `

            <p class="vacio">

                Todavía no hay movimientos
                recurrentes.

            </p>

        `;

        return;

    }


    recurrentes.forEach(
        item => {

            const fecha =
                obtenerProximaFechaRecurrente(
                    item.dia
                );


            const fechaTexto =
                fecha.toLocaleDateString(
                    "es-EC",
                    {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                    }
                );


            const esIngreso =
                item.tipo ===
                "ingreso";


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "recurrente-item";


            div.innerHTML = `

                <div
                    class="recurrente-superior"
                >

                    <div>

                        <h4>
                            ${item.nombre}
                        </h4>

                        <p>
                            ${
                                esIngreso
                                ? "Ingreso recurrente"
                                : "Gasto fijo"
                            }
                            ·
                            ${item.categoria}
                        </p>

                    </div>


                    <div
                        class="
                            recurrente-monto
                            ${
                                esIngreso
                                ? "recurrente-ingreso"
                                : "recurrente-gasto"
                            }
                        "
                    >

                        ${
                            esIngreso
                            ? "+"
                            : "-"
                        }

                        ${dinero(
                            item.monto
                        )}

                    </div>

                </div>


                <div
                    class="recurrente-proximo"
                >

                    📅 Próximo:
                    ${fechaTexto}

                </div>


                <div
                    class="acciones-recurrente"
                >

                    <button
                        class="
                            btn-aplicar-recurrente
                        "
                        onclick="
                            aplicarRecurrente(
                                ${item.id}
                            )
                        "
                    >

                        ${
                            esIngreso
                            ? "✓ Registrar recibido"
                            : "✓ Registrar pagado"
                        }

                    </button>


                    <button
                        class="
                            btn-eliminar-recurrente
                        "
                        onclick="
                            eliminarRecurrente(
                                ${item.id}
                            )
                        "
                    >
                        Eliminar
                    </button>

                </div>

            `;


            listaRecurrentes
                .appendChild(
                    div
                );

        }
    );

}

function actualizarResumenRecurrentes() {

    let ingresos =
        0;

    let gastos =
        0;


    recurrentes.forEach(
        item => {

            if (!item.activo) {
                return;
            }


            if (
                item.tipo ===
                "ingreso"
            ) {

                ingresos +=
                    Number(
                        item.monto
                    );

            }


            if (
                item.tipo ===
                "gasto"
            ) {

                gastos +=
                    Number(
                        item.monto
                    );

            }

        }
    );


    const balance =
        ingresos -
        gastos;


    const elementoIngresos =
        document.getElementById(
            "ingresosEsperados"
        );


    const elementoGastos =
        document.getElementById(
            "gastosFijosEsperados"
        );


    const elementoBalance =
        document.getElementById(
            "balanceProyectado"
        );


    if (elementoIngresos) {

        elementoIngresos.textContent =
            dinero(ingresos);

    }


    if (elementoGastos) {

        elementoGastos.textContent =
            dinero(gastos);

    }


    if (elementoBalance) {

        elementoBalance.textContent =
            dinero(balance);

    }

}

function actualizarRecurrentes() {

    mostrarRecurrentes();

    actualizarResumenRecurrentes();

}

function aplicarRecurrente(id) {

    const item =
        recurrentes.find(
            item =>
                item.id === id
        );


    if (!item) {
        return;
    }


    const accion =
        item.tipo === "ingreso"
            ? "recibiste"
            : "pagaste";


    const confirmar =
        confirm(

            "¿Confirmas que " +
            accion +
            " " +
            dinero(item.monto) +
            " por " +
            item.nombre +
            "?"

        );


    if (!confirmar) {
        return;
    }


    const movimiento = {

        id:
            Date.now(),

        tipo:
            item.tipo,

        monto:
            Number(
                item.monto
            ),

        categoria:
            item.categoria,

        descripcion:
            item.nombre,

        fecha:
            new Date()
                .toLocaleString(),

        fechaISO:
            new Date()
                .toISOString(),

        origen:
            "recurrente",

        recurrenteId:
            item.id

    };


    movimientos.push(
        movimiento
    );


    guardarDatos();

    actualizarPantalla();


    alert(
        item.tipo === "ingreso"

            ? "Ingreso registrado."

            : "Gasto registrado."
    );

}

function eliminarRecurrente(id) {

    const item =
        recurrentes.find(
            item =>
                item.id === id
        );


    if (!item) {
        return;
    }


    const confirmar =
        confirm(

            "¿Eliminar " +
            item.nombre +
            " del plan mensual?"

        );


    if (!confirmar) {
        return;
    }


    recurrentes =
        recurrentes.filter(
            item =>
                item.id !== id
        );


    guardarRecurrentes();

    actualizarRecurrentes();

}

actualizarRecurrentes();

// ======================================
// INICIAR APLICACIÓN
// ======================================

actualizarPantalla();