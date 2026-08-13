import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getFirestore,
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

// ==============================
// CONFIGURACIÓN FIREBASE
// ==============================

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCO4mIErVKRGI7ewzlIW9Gko1_8izqiSOU",
  authDomain: "mis-finanzas-3b933.firebaseapp.com",
  projectId: "mis-finanzas-3b933",
  storageBucket: "mis-finanzas-3b933.firebasestorage.app",
  messagingSenderId: "269227045033",
  appId: "1:269227045033:web:b9cf03c73e523bab8a39b8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Conectar Firestore

const db =
    getFirestore(app);

const auth =
    getAuth(app);

const provider =
    new GoogleAuthProvider();

// =====================================
// PRUEBA DE CONEXIÓN
// =====================================


// Guardaremos esto para usarlo
// posteriormente desde nuestra app

window.firebaseDB = db;

const btnLoginGoogle =
    document.getElementById(
        "btnLoginGoogle"
    );

const btnCerrarSesion =
    document.getElementById(
        "btnCerrarSesion"
    );

const zonaUsuario =
    document.getElementById(
        "usuarioConectado"
    );

const nombreUsuario =
    document.getElementById(
        "nombreUsuario"
    );


if (btnLoginGoogle) {

    btnLoginGoogle.addEventListener(
        "click",
        async function() {

            try {

                await signInWithPopup(
                    auth,
                    provider
                );

            }

            catch (error) {

                console.error(
                    "Error al iniciar sesión:",
                    error
                );

                alert(
                    "No se pudo iniciar sesión."
                );

            }

        }
    );

}


if (btnCerrarSesion) {

    btnCerrarSesion.addEventListener(
        "click",
        async function() {

            await signOut(auth);

        }
    );

}

onAuthStateChanged(
    auth,
    function(user) {

        if (user) {

            console.log(
                "Usuario conectado:",
                user.email
            );

            window.usuarioFirebase = user;
            
            escucharMovimientosNube(user);

            escucharEstadoNube(user);

            if (btnLoginGoogle) {

                btnLoginGoogle.style.display =
                    "none";

            }


            if (zonaUsuario) {

                zonaUsuario.style.display =
                    "block";

            }


            if (nombreUsuario) {

                nombreUsuario.textContent =
                    user.displayName ||
                    user.email;

            }

        }

        else {

            console.log(
                "Usuario desconectado"
            );


            window.usuarioFirebase =
                null;

            // ==========================
            // DETENER OTROS MÓDULOS
            // ==========================

            detenerEscuchasEstado
                .forEach(
                    detener => detener()
                );


            detenerEscuchasEstado = [];

            if (btnLoginGoogle) {

                btnLoginGoogle.style.display =
                    "inline-block";

            }


            if (zonaUsuario) {

                zonaUsuario.style.display =
                    "none";

            }

            if (detenerEscuchaMovimientos) {

                detenerEscuchaMovimientos();

                detenerEscuchaMovimientos = null;

            }
        }

    }
);

// ======================================
// MOVIMIENTOS EN FIRESTORE
// ======================================

let detenerEscuchaMovimientos = null;


// ======================================
// GUARDAR / ACTUALIZAR MOVIMIENTO
// ======================================

window.guardarMovimientoNube =
    async function(movimiento) {

        const user =
            auth.currentUser;


        if (!user) {

            console.warn(
                "No hay usuario conectado."
            );

            return;

        }


        try {

            const referencia =
                doc(
                    db,
                    "users",
                    user.uid,
                    "movimientos",
                    String(movimiento.id)
                );


            await setDoc(
                referencia,
                movimiento
            );


            console.log(
                "☁️ Movimiento guardado:",
                movimiento.id
            );

        }

        catch (error) {

            console.error(
                "Error guardando movimiento:",
                error
            );

        }

    };


// ======================================
// ELIMINAR MOVIMIENTO
// ======================================

window.eliminarMovimientoNube =
    async function(id) {

        const user =
            auth.currentUser;


        if (!user) {
            return;
        }


        try {

            await deleteDoc(

                doc(
                    db,
                    "users",
                    user.uid,
                    "movimientos",
                    String(id)
                )

            );


            console.log(
                "☁️ Movimiento eliminado:",
                id
            );

        }

        catch (error) {

            console.error(
                "Error eliminando movimiento:",
                error
            );

        }

    };


// ======================================
// ESCUCHAR MOVIMIENTOS
// ======================================

function escucharMovimientosNube(user) {

    // Evitar dos escuchas simultáneas

    if (detenerEscuchaMovimientos) {

        detenerEscuchaMovimientos();

    }


    const referencia =
        collection(
            db,
            "users",
            user.uid,
            "movimientos"
        );


    detenerEscuchaMovimientos =
        onSnapshot(

            referencia,

            function(snapshot) {

                const datos = [];


                snapshot.forEach(
                    documento => {

                        datos.push(
                            documento.data()
                        );

                    }
                );


                // Ordenar más recientes primero
                // internamente conservaremos
                // el orden cronológico normal

                datos.sort(
                    (a, b) =>
                        Number(a.id) -
                        Number(b.id)
                );


                console.log(
                    "☁️ Movimientos recibidos:",
                    datos.length
                );


                if (
                    window
                    .cargarMovimientosDesdeNube
                ) {

                    window
                    .cargarMovimientosDesdeNube(
                        datos
                    );

                }

            },

            function(error) {

                console.error(
                    "Error leyendo movimientos:",
                    error
                );

            }

        );

}

// ======================================
// SINCRONIZACIÓN GENERAL DE ESTADO
// ======================================

let detenerEscuchasEstado = [];


// ======================================
// GUARDAR UN MÓDULO EN FIRESTORE
// ======================================

window.guardarEstadoNube =
    async function(nombre, datos) {

        const user =
            auth.currentUser;


        if (!user) {

            console.warn(
                "No hay usuario conectado."
            );

            return;

        }


        try {

            const referencia =
                doc(
                    db,
                    "users",
                    user.uid,
                    "estado",
                    nombre
                );


            await setDoc(
                referencia,
                datos
            );


            console.log(
                "☁️ Estado guardado:",
                nombre
            );

        }

        catch (error) {

            console.error(
                "Error guardando " +
                nombre +
                ":",
                error
            );

        }

    };

    // ======================================
// ESCUCHAR ESTADO EN TIEMPO REAL
// ======================================

function escucharEstadoNube(user) {

    // Detener escuchas anteriores

    detenerEscuchasEstado
        .forEach(
            detener => detener()
        );


    detenerEscuchasEstado = [];


    const modulos = [

        "deudas",

        "metas",

        "presupuestos",

        "recurrentes"

    ];


    modulos.forEach(
        nombre => {

            const referencia =
                doc(
                    db,
                    "users",
                    user.uid,
                    "estado",
                    nombre
                );


            const detener =
                onSnapshot(

                    referencia,

                    async function(snapshot) {

                        // ==========================
                        // YA EXISTE EN LA NUBE
                        // ==========================

                        if (snapshot.exists()) {

                            const datos =
                                snapshot.data();


                            console.log(
                                "☁️ Recibido:",
                                nombre
                            );


                            if (
                                window
                                .cargarEstadoDesdeNube
                            ) {

                                window
                                    .cargarEstadoDesdeNube(
                                        nombre,
                                        datos
                                    );

                            }


                            return;

                        }


                        // ==========================
                        // TODAVÍA NO EXISTE
                        // ==========================

                        console.log(
                            "☁️ No existe " +
                            nombre +
                            ". Migrando datos locales..."
                        );


                        if (
                            window
                            .obtenerEstadoLocalParaFirebase
                        ) {

                            const local =
                                window
                                    .obtenerEstadoLocalParaFirebase(
                                        nombre
                                    );


                            if (local) {

                                await setDoc(
                                    referencia,
                                    local
                                );

                            }

                        }

                    },

                    function(error) {

                        console.error(
                            "Error escuchando " +
                            nombre +
                            ":",
                            error
                        );

                    }

                );


            detenerEscuchasEstado.push(
                detener
            );

        }
    );

}