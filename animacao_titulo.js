/**
 * Músicas para o Dia — Script Unificado
 * Animação de título (shimmer + letras flutuantes),
 * acordeão exclusivo e busca accent-insensitive
 */
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════
    //  UTILITÁRIOS
    // ═══════════════════════════════════════════════════

    /** Remove acentos, símbolos e normaliza para busca */
    function normalizarTexto(texto) {
        if (!texto) return '';
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[ºª°.]/g, '')
            .trim();
    }

    /** Debounce genérico */
    function debounce(fn, espera) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), espera);
        };
    }

    /** Verifica se a página está numa subpasta */
    function estaNaSubpasta() {
        const p = window.location.pathname;
        return p.includes('/quaresma/') || p.includes('/pascoa/');
    }

    /** Resolve caminho do JSON conforme localização */
    function resolverCaminhoJSON() {
        return estaNaSubpasta() ? '../musicas.json' : 'musicas.json';
    }

    /** Ajusta link da música conforme localização da página */
    function resolverLinkMusica(link) {
        if (!estaNaSubpasta()) return link;
        if (link.startsWith('quaresma/')) return link.replace('quaresma/', '');
        if (link.startsWith('pascoa/'))   return link.replace('pascoa/', '');
        if (!link.startsWith('../') && !link.startsWith('http')) return '../' + link;
        return link;
    }

    /** Cria regex accent-insensitive para destacar texto */
    function criarRegexDestaque(termo) {
        const mapa = {
            'a': '[aáàãâä]', 'e': '[eéèêë]', 'i': '[iíìîï]',
            'o': '[oóòõôö]', 'u': '[uúùûü]', 'c': '[cç]', 'n': '[nñ]'
        };
        const especiais = /[.*+?^${}()|[\]\\]/;
        const pattern = termo.split('').map(ch => {
            if (especiais.test(ch)) return '\\' + ch;
            const lower = ch.toLowerCase();
            return mapa[lower] || ch;
        }).join('');
        return new RegExp('(' + pattern + ')', 'gi');
    }

    // ═══════════════════════════════════════════════════
    //  ANIMAÇÃO DO TÍTULO
    // ═══════════════════════════════════════════════════

    function setupAnimacaoTitulo() {
        const titulo = document.getElementById('titulo-agitado');
        if (!titulo) return;

        // ── Shimmer dourado ao mover o mouse ──
        titulo.addEventListener('mousemove', (e) => {
            const rect = titulo.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            titulo.style.setProperty('--shine-x', x + '%');
            titulo.style.setProperty('--shine-y', y + '%');
        });

        titulo.addEventListener('mouseleave', () => {
            titulo.style.removeProperty('--shine-x');
            titulo.style.removeProperty('--shine-y');
        });

        // ── Letras flutuantes ──
        const texto = titulo.textContent;
        titulo.innerHTML = '';

        [...texto].forEach((char) => {
            const span = document.createElement('span');
            if (char === ' ') {
                span.innerHTML = '&nbsp;';
            } else {
                span.textContent = char;
                span.className = 'letra-agitada';
                span.style.animationDelay = (Math.random() * -5).toFixed(2) + 's';
                span.style.animationDuration = (3 + Math.random() * 2).toFixed(2) + 's';
            }
            titulo.appendChild(span);
        });
    }

    // ═══════════════════════════════════════════════════
    //  ACORDEÃO
    // ═══════════════════════════════════════════════════

    function setupAcordeao() {
        // ── Categorias (exclusivo: fecha as outras) ──
        const btnsCategoria = document.querySelectorAll('.btn-categoria');

        btnsCategoria.forEach((btn) => {
            btn.addEventListener('click', function () {
                const lista = this.nextElementSibling;
                const seta  = this.querySelector('.seta');
                const abrindo = !this.classList.contains('aberto');

                // Fecha todas as outras categorias
                btnsCategoria.forEach((outro) => {
                    if (outro !== this) {
                        outro.classList.remove('aberto');
                        const ol = outro.nextElementSibling;
                        const os = outro.querySelector('.seta');
                        if (ol) ol.classList.remove('ativo');
                        if (os) os.classList.remove('seta-girada');
                    }
                });

                // Toggle da categoria atual
                this.classList.toggle('aberto', abrindo);
                if (lista) lista.classList.toggle('ativo', abrindo);
                if (seta)  seta.classList.toggle('seta-girada', abrindo);
            });
        });

        // ── Músicas (independente, sem inline style) ──
        const btnsMusica = document.querySelectorAll('.btn-titulo-musica');

        btnsMusica.forEach((btn) => {
            btn.addEventListener('click', function () {
                const letra   = this.nextElementSibling;
                const abrindo = !this.classList.contains('musica-aberta');

                this.classList.toggle('musica-aberta', abrindo);
                if (letra) letra.classList.toggle('ativo', abrindo);
            });
        });
    }

    // ═══════════════════════════════════════════════════
    //  BUSCA DE MÚSICAS
    // ═══════════════════════════════════════════════════

    function setupBusca() {
        const searchInput   = document.getElementById('searchInput');
        const searchBar     = document.getElementById('searchBar');
        const searchOverlay = document.getElementById('searchOverlay');
        const btnAbrirBusca = document.getElementById('btnAbrirBusca');

        if (!searchInput || !searchBar) return;

        let bancoDeMusicas = [];
        let bancoCarregado = false;

        // Container de resultados (criado uma vez, reutilizado)
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'search-results';
        resultsContainer.className = 'search-results-list';

        // ── Carregar banco de músicas (lazy) ──
        async function carregarBanco() {
            if (bancoCarregado) return;
            try {
                const resp = await fetch(resolverCaminhoJSON());
                if (!resp.ok) throw new Error('Erro HTTP ' + resp.status);
                bancoDeMusicas = await resp.json();
                bancoCarregado = true;
            } catch (err) {
                console.error('Erro ao carregar banco de músicas:', err);
            }
        }

        // ── Abrir busca ──
        function abrirBusca() {
            searchBar.classList.add('active');
            if (searchOverlay) {
                searchOverlay.style.display = 'block';
                searchOverlay.classList.add('active');
            }
            document.body.style.overflow = 'hidden';
            searchInput.focus();
            if (!bancoCarregado) carregarBanco();
        }

        // ── Fechar busca ──
        function fecharBusca() {
            searchBar.classList.remove('active');
            if (searchOverlay) {
                searchOverlay.style.display = 'none';
                searchOverlay.classList.remove('active');
            }
            document.body.style.overflow = '';
            searchInput.value = '';
            limparResultados();
        }

        // ── Limpar resultados ──
        function limparResultados() {
            resultsContainer.innerHTML = '';
            if (resultsContainer.parentNode) resultsContainer.remove();
        }

        // ── Destacar texto com <mark> (accent-insensitive) ──
        function destacarTexto(texto, termo) {
            try {
                const regex = criarRegexDestaque(termo);
                return texto.replace(regex, '<mark>$1</mark>');
            } catch {
                return texto;
            }
        }

        // ── Criar snippet da letra em torno do trecho encontrado ──
        function criarSnippet(letra, termoNorm) {
            if (!letra) return '';

            // Mapeia posições da string normalizada → string original
            let normStr = '';
            const posMap = []; // posMap[índice normalizado] = índice original

            for (let i = 0; i < letra.length; i++) {
                const chNorm = letra[i]
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[ºª°.]/g, '');

                if (chNorm.length === 0) continue; // ignora chars que somem

                for (let j = 0; j < chNorm.length; j++) {
                    posMap[normStr.length + j] = i;
                }
                normStr += chNorm;
            }

            const matchIdx = normStr.indexOf(termoNorm);
            if (matchIdx === -1) return letra.substring(0, 80) + '…';

            const origStart = posMap[matchIdx] || 0;
            const matchEnd  = Math.min(matchIdx + termoNorm.length - 1, posMap.length - 1);
            const origEnd   = posMap[matchEnd] !== undefined ? posMap[matchEnd] : origStart;

            const start = Math.max(0, origStart - 30);
            const end   = Math.min(letra.length, origEnd + 50);

            let snippet = letra.substring(start, end);
            if (start > 0) snippet = '…' + snippet;
            if (end < letra.length) snippet += '…';
            return snippet;
        }

        // ── Exibir resultados ──
        function exibirResultados(resultados, termoOriginal, termoNorm) {
            limparResultados();
            searchBar.appendChild(resultsContainer);

            if (resultados.length === 0) {
                resultsContainer.innerHTML =
                    '<div class="no-results">Nenhuma música encontrada.</div>';
                return;
            }

            resultados.slice(0, 8).forEach((m) => {
                const item = document.createElement('div');
                item.className = 'result-item';

                const tituloHTML  = destacarTexto(m.titulo, termoOriginal);
                const snippet     = criarSnippet(m.letra || '', termoNorm);
                const snippetHTML = destacarTexto(snippet, termoOriginal);

                item.innerHTML =
                    '<strong>' + tituloHTML + '</strong>' +
                    '<p>' + snippetHTML + '</p>';

                item.addEventListener('click', () => {
                    const link = m.link || m.pagina;
                    if (link) window.location.href = resolverLinkMusica(link);
                    fecharBusca();
                });

                resultsContainer.appendChild(item);
            });
        }

        // ── Lógica de busca ──
        function realizarBusca(termoOriginal, termoNorm) {
            const resultados = bancoDeMusicas.filter((m) =>
                normalizarTexto(m.titulo).includes(termoNorm) ||
                normalizarTexto(m.letra).includes(termoNorm)
            );
            exibirResultados(resultados, termoOriginal, termoNorm);
        }

        // ── Eventos ──

        // Botão "Buscar música" na nav
        if (btnAbrirBusca) {
            btnAbrirBusca.addEventListener('click', abrirBusca);
        }

        // Clique na barra de busca (quando recolhida)
        searchBar.addEventListener('click', () => {
            if (!searchBar.classList.contains('active')) abrirBusca();
        });

        // Clique no overlay fecha
        if (searchOverlay) {
            searchOverlay.addEventListener('click', fecharBusca);
        }

        // ESC fecha
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchBar.classList.contains('active')) {
                fecharBusca();
            }
        });

        // Digitar com debounce + normalização de acentos
        searchInput.addEventListener('input', debounce(function () {
            const termoOriginal = searchInput.value.trim();
            const termoNorm     = normalizarTexto(termoOriginal);

            limparResultados();

            if (termoNorm.length < 2) return;

            if (!bancoCarregado) {
                carregarBanco().then(() => realizarBusca(termoOriginal, termoNorm));
                return;
            }

            realizarBusca(termoOriginal, termoNorm);
        }, 300));
    }

    // ═══════════════════════════════════════════════════
    //  INICIALIZAÇÃO
    // ═══════════════════════════════════════════════════

    function init() {
        setupAnimacaoTitulo();
        setupAcordeao();
        setupBusca();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();