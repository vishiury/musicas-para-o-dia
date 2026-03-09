/**
 * PLANEJADOR DE MISSA - Versão Corrigida e Blindada
 */

document.addEventListener("DOMContentLoaded", function() {
    // Seleção de Elementos
    const btnPlanejador = document.getElementById("btn-planejador");
    const modalPlanejador = document.getElementById("modal-planejador");
    const overlayPlanejador = document.getElementById("overlay-planejador");
    const btnFechar = document.getElementById("fechar-planejador");
    const btnPdf = document.getElementById("btn-preparar-pdf");
    
    let bancoDeMusicas = [];
    let resultadosDiv = null;

    // --- 1. FUNÇÕES DO MODAL (ABRIR/FECHAR) ---
    function abrirModal() {
        console.log("Tentando abrir o modal..."); // Log para teste
        if (modalPlanejador && overlayPlanejador) {
            modalPlanejador.classList.add("ativo");
            overlayPlanejador.classList.add("ativo");
            document.body.style.overflow = "hidden"; // Trava o scroll do fundo
            
            // Carrega os dados apenas se o banco estiver vazio
            if (bancoDeMusicas.length === 0) carregarDados();
        } else {
            console.error("Erro: Elementos do modal não encontrados no HTML.");
        }
    }

    function fecharModal() {
        modalPlanejador.classList.remove("ativo");
        overlayPlanejador.classList.remove("ativo");
        document.body.style.overflow = "auto";
        if (resultadosDiv) resultadosDiv.style.display = 'none';
    }

    // Eventos de Clique
    btnPlanejador?.addEventListener("click", abrirModal);
    btnFechar?.addEventListener("click", fecharModal);
    overlayPlanejador?.addEventListener("click", fecharModal);

    // --- 2. CARREGAR DADOS DO JSON ---
    async function carregarDados() {
        try {
            const estaNaSubpasta = window.location.pathname.includes('/quaresma/') || window.location.pathname.includes('/pascoa/');
            const path = estaNaSubpasta ? '../musicas.json' : 'musicas.json';
            
            const res = await fetch(path);
            if (!res.ok) throw new Error("Não foi possível carregar o musicas.json");
            bancoDeMusicas = await res.json();
            console.log("Banco carregado no Planejador!");
        } catch (e) {
            console.error("Erro no fetch do Planejador:", e);
        }
    }

    // --- 3. LOGICA DE BUSCA POR CATEGORIA ---
    const inputsMusica = document.querySelectorAll('.input-musica');
    
    inputsMusica.forEach(input => {
        input.addEventListener('input', debounce(function() {
            const termo = normalizarTexto(this.value);
            const categoriaAlvo = this.getAttribute('data-categoria');
            
            if (!resultadosDiv) {
                resultadosDiv = document.createElement('div');
                resultadosDiv.className = 'sugestoes-planejador';
                document.body.appendChild(resultadosDiv);
            }

            resultadosDiv.innerHTML = "";

            if (termo.length < 2) {
                resultadosDiv.style.display = 'none';
                return;
            }

            // Filtra por Texto e pela Categoria do Input
            const filtrados = bancoDeMusicas.filter(m => {
                const bateTexto = normalizarTexto(m.titulo).includes(termo);
                const bateCategoria = m.categoria === categoriaAlvo;
                return bateTexto && bateCategoria;
            });

            if (filtrados.length > 0) {
                const rect = this.getBoundingClientRect();
                resultadosDiv.style.top = `${rect.bottom + window.scrollY}px`;
                resultadosDiv.style.left = `${rect.left}px`;
                resultadosDiv.style.width = `${rect.width}px`;
                resultadosDiv.style.display = 'block';

                filtrados.forEach(musica => {
                    const item = document.createElement('div');
                    item.className = 'item-sugestao';
                    item.innerHTML = `<strong>${musica.titulo}</strong>`;
                    item.onclick = () => {
                        this.value = musica.titulo;
                        this.setAttribute('data-letra', musica.letra);
                        resultadosDiv.style.display = 'none';
                        salvarNoStorage();
                    };
                    resultadosDiv.appendChild(item);
                });
            } else {
                resultadosDiv.style.display = 'none';
            }
        }, 300));
    });

    // --- 4. SALVAMENTO (LOCALSTORAGE) ---
    function salvarNoStorage() {
        const momentos = document.querySelectorAll(".momento-missa");
        const dados = Array.from(momentos).map(m => {
            const input = m.querySelector(".input-musica");
            return {
                check: m.querySelector(".check-momento").checked,
                musica: input.value,
                tom: m.querySelector(".input-tom").value,
                letra: input.getAttribute("data-letra") || ""
            };
        });
        localStorage.setItem("meuRepertorioMissa", JSON.stringify(dados));
    }

    function carregarDoStorage() {
        const salvos = JSON.parse(localStorage.getItem("meuRepertorioMissa") || "[]");
        const momentos = document.querySelectorAll(".momento-missa");
        momentos.forEach((m, i) => {
            if (salvos[i]) {
                const input = m.querySelector(".input-musica");
                m.querySelector(".check-momento").checked = salvos[i].check;
                input.value = salvos[i].musica;
                m.querySelector(".input-tom").value = salvos[i].tom;
                input.setAttribute("data-letra", salvos[i].letra);
            }
        });
    }

    carregarDoStorage();

    // Redirecionar para o PDF
    btnPdf?.addEventListener("click", function() {
        salvarNoStorage();
        const estaNaSubpasta = window.location.pathname.includes('/quaresma/') || window.location.pathname.includes('/pascoa/');
        window.location.href = estaNaSubpasta ? '../gerar_pdf.html' : 'gerar_pdf.html';
    });
});