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
                const velocidadeSuave = (3 + Math.random() * 2).toFixed(2);
                letraSpan.style.animationDuration = `${velocidadeSuave}s`;
            }
            titulo.appendChild(letraSpan);
        });
    }

    // --- 2. CONTROLE DA BARRA DE PESQUISA E OVERLAY ---
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    const searchOverlay = document.getElementById('searchOverlay');
    const body = document.body;

    // Criar um container para os resultados
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'search-results';
    resultsContainer.className = 'search-results-list';
    searchBar.appendChild(resultsContainer);

    let bancoDeMusicas = [];

    searchBar.addEventListener('click', () => {
        if (!searchBar.classList.contains('active')) {
            searchBar.classList.add('active');
            searchOverlay.style.display = 'block';
            body.style.overflow = 'hidden';
            searchInput.focus();
            
            if (bancoDeMusicas.length === 0) {
                carregarBancoDeMusicas();
            }
        }
    });

    searchOverlay.addEventListener('click', () => {
        searchBar.classList.remove('active');
        searchOverlay.style.display = 'none';
        body.style.overflow = 'auto';
        resultsContainer.innerHTML = "";
        searchInput.value = "";
    });

    // --- 3. O "ROBÔ" DE BUSCA (SCRAPING) ---
    async function carregarBancoDeMusicas() {
        const paginas = [
            'domingo1.html',
            'domingo2.html',
            'domingo3.html',
            'domingo4.html',
            'domingo5.html',
            'extras.html'
        ];

        for (let url of paginas) {
            try {
                const response = await fetch(url);
                if (!response.ok) continue;
                const htmlText = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                
                const titulos = doc.querySelectorAll('h3');
                titulos.forEach(titulo => {
                    let letraCompleta = "";
                    let proximoElemento = titulo.nextElementSibling;
                    
                    while (proximoElemento && proximoElemento.tagName === 'P') {
                        letraCompleta += proximoElemento.textContent + " ";
                        proximoElemento = proximoElemento.nextElementSibling;
                    }

                    bancoDeMusicas.push({
                        titulo: titulo.textContent,
                        letra: letraCompleta,
                        link: url
                    });
                });
            } catch (err) {
                console.error("Erro ao ler página:", url);
            }
        }
    }

    // --- 4. FILTRAGEM COM DESTAQUE E MENSAGEM DE ERRO ---
    searchInput.addEventListener('input', () => {
    // .trim() remove espaços vazios do início e do fim
    const termo = searchInput.value.toLowerCase().trim();
    resultsContainer.innerHTML = "";

    // Se o termo estiver vazio ou for apenas espaços, não faz nada e sai da função
    if (termo === "" || termo.length < 2) {
        return; 
    }
        // 1. Filtramos o banco de músicas
const resultados = bancoDeMusicas.filter(m => 
    m.titulo.toLowerCase().includes(termo) || 
    m.letra.toLowerCase().includes(termo)
);

// 2. Verificamos se a lista está vazia no momento de imprimir
if (resultados.length === 0) {
    resultsContainer.innerHTML = `
        <div class="result-item no-results">
            <p>🔍 Nenhuma música encontrada. Tente outra palavra ou o refrão!</p>
        </div>`;
} else {
    // 3. Se houver resultados, imprimimos a lista normalmente
    resultados.forEach(m => {
        // ... (código que cria os itens com destaque amarelo)
    });
}

        

        resultados.forEach(m => {
            const item = document.createElement('div');
            item.className = 'result-item';
            
            // Lógica para pegar um trecho da letra
            const index = m.letra.toLowerCase().indexOf(termo);
            let trecho = index > -1 
                ? "..." + m.letra.substring(Math.max(0, index - 30), index + 50) + "..." 
                : m.letra.substring(0, 70) + "...";

            // OPÇÃO 1: Destaque (Marca-texto)
            const regex = new RegExp(`(${termo})`, 'gi');
            const tituloDestacado = m.titulo.replace(regex, '<mark>$1</mark>');
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