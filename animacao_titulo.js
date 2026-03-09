/**
 * PROJETO: Músicas para o Dia
 * VERSÃO: 3.0 - Acordeão Profissional + Busca Inteligente + Correção de Caminhos
 */

// 1. UTILITÁRIOS: Limpeza de texto (Acentos e Símbolos)
function normalizarTexto(texto) {
    if (!texto) return "";
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[ºª°.]/g, "")
        .trim();
}

// 2. UTILITÁRIOS: Debounce (Performance)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.addEventListener("DOMContentLoaded", function() {
    
    // --- PARTE A: ANIMAÇÃO DO TÍTULO ---
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

    // --- PARTE B: LÓGICA DO ACORDEÃO (ABRIR/FECHAR) ---
    const botoesCategoria = document.querySelectorAll('.btn-categoria');
    const botoesMusica = document.querySelectorAll('.btn-titulo-musica');

    botoesCategoria.forEach(botao => {
        botao.addEventListener('click', function() {
            const lista = this.nextElementSibling;
            const seta = this.querySelector('.seta');
            lista.classList.toggle('ativo');
            if (seta) seta.classList.toggle('seta-girada');
        });
    });

    botoesMusica.forEach(botao => {
        botao.addEventListener('click', function() {
            const letra = this.nextElementSibling;
            letra.classList.toggle('ativo');
            this.style.backgroundColor = letra.classList.contains('ativo') 
                ? 'rgba(214, 192, 255, 0.2)' 
                : 'transparent';
        });
    });

    // --- PARTE C: CONFIGURAÇÃO DA BUSCA ---
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    const searchOverlay = document.getElementById('searchOverlay');
    const body = document.body;
    let bancoDeMusicas = [];

    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'search-results';
    resultsContainer.className = 'search-results-list';
    searchBar?.appendChild(resultsContainer);

    const estaNaSubpasta = window.location.pathname.includes('/quaresma/') || window.location.pathname.includes('/pascoa/');

    async function carregarBancoDeMusicas() {
        try {
            const path = estaNaSubpasta ? '../musicas.json' : 'musicas.json';
            const response = await fetch(path);
            if (!response.ok) throw new Error("Erro JSON");
            bancoDeMusicas = await response.json();
        } catch (err) {
            console.error("Erro ao carregar banco:", err);
        }
    }

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

    searchInput?.addEventListener('input', debounce(() => {
        const termoOriginal = searchInput.value;
        const termoNorm = normalizarTexto(termoOriginal);
        resultsContainer.innerHTML = "";

        if (termoNorm.length < 2) return;

        const resultados = bancoDeMusicas.filter(m => 
            normalizarTexto(m.titulo).includes(termoNorm) || 
            normalizarTexto(m.letra).includes(termoNorm)
        );

        resultados.forEach(m => {
            const item = document.createElement('div');
            item.className = 'result-item';
            
            const regex = new RegExp(`(${termoOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            const tituloDestacado = m.titulo.replace(regex, '<mark>$1</mark>');
            
            item.innerHTML = `<strong>${tituloDestacado}</strong>`;
            
            item.onclick = () => {
                let linkFinal = m.link;
                if (estaNaSubpasta) {
                    if (linkFinal.startsWith('quaresma/')) linkFinal = linkFinal.replace('quaresma/', '');
                    else if (!linkFinal.startsWith('../')) linkFinal = '../' + linkFinal;
                }
                window.location.href = linkFinal;
            };
            resultsContainer.appendChild(item);
        });
    }, 300));
});