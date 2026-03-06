// 1. Função de Normalização (Colocada fora para ser global)
function normalizarTexto(texto) {
    if (!texto) return "";
    return texto
        .toLowerCase()
        .normalize("NFD")                             // Decompõe acentos
        .replace(/[\u0300-\u036f]/g, "")           // Remove os acentos
        .replace(/[ºª°.]/g, "")                    // Remove símbolos específicos
        .trim();
}

document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. ANIMAÇÃO DO TÍTULO ---
    const titulo = document.getElementById("titulo-agitado");
    if (titulo) {
        const texto = titulo.textContent;
        titulo.textContent = "";
        [...texto].forEach((caractere) => {
            const letraSpan = document.createElement("span");
            if (caractere === " ") {
                letraSpan.innerHTML = "&nbsp;";
            } else {
                letraSpan.textContent = caractere;
                letraSpan.className = "letra-agitada";
                letraSpan.style.animationDelay = `${(Math.random() * -5).toFixed(2)}s`;
                letraSpan.style.animationDuration = `${(3 + Math.random() * 2).toFixed(2)}s`;
            }
            titulo.appendChild(letraSpan);
        });
    }

    // --- 2. CONFIGURAÇÃO DA BARRA DE PESQUISA ---
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    const searchOverlay = document.getElementById('searchOverlay');
    const body = document.body;

    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'search-results';
    resultsContainer.className = 'search-results-list';
    searchBar?.appendChild(resultsContainer);

    let bancoDeMusicas = [];

    searchBar?.addEventListener('click', () => {
        if (!searchBar.classList.contains('active')) {
            searchBar.classList.add('active');
            searchOverlay.style.display = 'block';
            body.style.overflow = 'hidden';
            searchInput.focus();
            if (bancoDeMusicas.length === 0) carregarBancoDeMusicas();
        }
    });

    searchOverlay?.addEventListener('click', () => {
        searchBar.classList.remove('active');
        searchOverlay.style.display = 'none';
        body.style.overflow = 'auto';
        resultsContainer.innerHTML = "";
        searchInput.value = "";
    });

    // --- 3. ROBÔ DE BUSCA (SCRAPING) ---
    async function carregarBancoDeMusicas() {
        const paginas = ['domingo1.html', 'domingo2.html', 'domingo3.html', 'domingo4.html', 'domingo5.html', 'extras.html'];

        for (let url of paginas) {
            try {
                const response = await fetch(url);
                if (!response.ok) continue;
                const htmlText = await response.text();
                const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                
                const titulos = doc.querySelectorAll('h3');
                titulos.forEach(titulo => {
                    let letraCompleta = "";
                    let proximo = titulo.nextElementSibling;
                    while (proximo && proximo.tagName === 'P') {
                        letraCompleta += proximo.textContent + " ";
                        proximo = proximo.nextElementSibling;
                    }
                    bancoDeMusicas.push({
                        titulo: titulo.textContent,
                        letra: letraCompleta,
                        link: url
                    });
                });
            } catch (err) { console.error("Erro ao ler:", url); }
        }
    }

    // --- 4. FILTRAGEM COM NORMALIZAÇÃO ---
    searchInput?.addEventListener('input', () => {
        const termoOriginal = searchInput.value;
        const termoNorm = normalizarTexto(termoOriginal);
        resultsContainer.innerHTML = "";

        if (termoNorm.length < 2) return;

        // Filtra comparando as versões normalizadas
        const resultados = bancoDeMusicas.filter(m => 
            normalizarTexto(m.titulo).includes(termoNorm) || 
            normalizarTexto(m.letra).includes(termoNorm)
        );

        if (resultados.length === 0) {
            resultsContainer.innerHTML = `
                <div class="result-item no-results">
                    <p>🔍 Nenhuma música encontrada para "${termoOriginal}"</p>
                </div>`;
            return;
        }

        resultados.forEach(m => {
            const item = document.createElement('div');
            item.className = 'result-item';
            
            // Lógica de destaque visual
            const regex = new RegExp(`(${termoOriginal.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
            const tituloDestacado = m.titulo.replace(regex, '<mark>$1</mark>');
            
            const index = normalizarTexto(m.letra).indexOf(termoNorm);
            let trecho = index > -1 
                ? "..." + m.letra.substring(Math.max(0, index - 30), index + 50) + "..." 
                : m.letra.substring(0, 70) + "...";
            const trechoDestacado = trecho.replace(regex, '<mark>$1</mark>');

            item.innerHTML = `
                <strong>${tituloDestacado}</strong>
                <p>${trechoDestacado}</p>
            `;
            
            item.onclick = () => window.location.href = m.link;
            resultsContainer.appendChild(item);
        });
    });
});