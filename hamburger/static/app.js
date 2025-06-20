    // app.js
    document.addEventListener('DOMContentLoaded', () => {
        

        // URL de tu API (cámbiala por la real)
        const API_URL = "https://lacapital-production.up.railway.app/api/hamburguesas/listar/";


        // ---- Config responsive: 2 cards en móvil, 4 en desktop ----
        let cardsPerPage = window.innerWidth <= 600 ? 2 : 4;
        window.addEventListener('resize', () => {
            const nuevo = window.innerWidth <= 600 ? 2 : 4;
            if (nuevo !== cardsPerPage) {
                cardsPerPage = nuevo;
                currentPage = 1;
                renderCards(currentPage);
                renderPagination();
            }
        });

        // ---- Variables de estado ----
        let burgerData = [];        // Se llenará con la respuesta del fetch
        let currentPage = 1;
        let currentActiveCard = null;

        // ---- Referencias al DOM ----
        const cardsContainer      = document.getElementById('cards-container');
        const burgerTitle         = document.getElementById('burger-title');
        const burgerDesc          = document.querySelector('.burger-desc');
        const paginationContainer = document.getElementById('pagination');

        // ---- Pequeño helper de “loading / error” ----
        const showLoading    = (msg) => { cardsContainer.innerHTML = `<p style="color:#ccc;text-align:center">${msg}</p>`; };
        const showError      = (msg) => { cardsContainer.innerHTML = `<p style="color:#f66;text-align:center">${msg}</p>`; };

        // ===========================================================
        // 1) Cargar datos desde la API
        // ===========================================================
        async function fetchBurgers() {
            showLoading('Cargando menú…');
            try {
                const res  = await fetch(API_URL);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();                    // ← array de objetos
                burgerData = data.map((b) => ({
                    image:       b.imagen,
                    title:       b.nombre,
                    // descripción combinada
                    description: `${b.descripcion}, tiene una altura de ${b.tamaño_alto} cm, un ancho de ${b.tamaño_ancho} cm, su precio es de ${b.precio}Bs.`,
                    modelPath:   b.modelo3d,
                    texturePath: b.textura_modelo
                }));
                // Pintamos interfaz
                currentPage = 1;
                renderCards(currentPage);
                renderPagination();
                if (burgerData.length && typeof loadModel === 'function') {
                    loadModel(burgerData[0].modelPath, burgerData[0].texturePath);
                }
            } catch (err) {
                console.error(err);
                showError('No se pudo cargar el menú 😢');
            }
        }

        // ===========================================================
        // 2) Renderizar tarjetas para la página actual
        // ===========================================================
        function renderCards(page) {
            if (!burgerData.length) return;
            cardsContainer.innerHTML = '';
            const start = (page - 1) * cardsPerPage;
            const slice = burgerData.slice(start, start + cardsPerPage);

            slice.forEach((burger, idx) => {
                const card = document.createElement('div');
                card.className = 'card';
                if (start + idx === 0 && !currentActiveCard) {
                    card.classList.add('active');
                    currentActiveCard = card;
                }
                card.innerHTML = `
                    <img class="card-image" src="${burger.image}" alt="${burger.title}">
                    <p  class="card-title">${burger.title}</p>
                `;
                card.addEventListener('click', () => {
                    if (currentActiveCard) currentActiveCard.classList.remove('active');
                    card.classList.add('active');
                    currentActiveCard      = card;
                    burgerTitle.textContent = burger.title;
                    burgerDesc.textContent  = burger.description;
                    if (typeof loadModel === 'function') {
                        loadModel(burger.modelPath, burger.texturePath);
                    }
                });
                cardsContainer.appendChild(card);
            });
        }

        // ===========================================================
        // 3) Renderizar la paginación
        // ===========================================================
        function renderPagination() {   
            paginationContainer.innerHTML = '';
            if (!burgerData.length) return;
            const total = Math.ceil(burgerData.length / cardsPerPage);

            const addBtn = (text, handler, extraClass='') => {
                const btn = document.createElement('button');
                btn.textContent = text;
                btn.className   = `pagination-button ${extraClass}`;
                btn.addEventListener('click', handler);
                paginationContainer.appendChild(btn);
            };

            if (currentPage > 1) addBtn('<', () => { currentPage--; renderCards(currentPage); renderPagination(); });

            for (let i = 1; i <= total; i++) {
                addBtn(i, () => { currentPage = i; renderCards(currentPage); renderPagination(); },
                    i === currentPage ? 'active' : '');
            }

            if (currentPage < total) addBtn('>', () => { currentPage++; renderCards(currentPage); renderPagination(); });
        }

        // ===========================================================
        // 4) ¡Disparamos la carga inicial!
        // ===========================================================
        fetchBurgers();
    });
