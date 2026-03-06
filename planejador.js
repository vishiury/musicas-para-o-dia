// 1. Movi a função para fora para organização e clareza
function normalizarTexto(texto) {
    if (!texto) return "";
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[ºª°.]/g, "")
        .trim();
}

document.addEventListener("DOMContentLoaded", function() {
    const btnPlanejador = document.getElementById("btn-planejador");
    const modalPlanejador = document.getElementById("modal-planejador");
    const overlayPlanejador = document.getElementById("overlay-planejador");
    const btnFechar = document.getElementById("fechar-planejador");
    const btnPdf = document.getElementById("btn-preparar-pdf");
    
    let bancoDeMusicas = []; 

    // --- CONTROLE DO MODAL ---
    function abrirModal() {
        modalPlanejador.classList.add("ativo");
        overlayPlanejador.classList.add("ativo");
        document.body.style.overflow = "hidden";
        if (bancoDeMusicas.length === 0) carregarBancoDeMusicas();
    }

    function fecharModal() {
        modalPlanejador.classList.remove("ativo");
        overlayPlanejador.classList.remove("ativo");
        document.body.style.overflow = "auto";
    }

    btnPlanejador?.addEventListener("click", abrirModal);
    btnFechar?.addEventListener("click", fecharModal);
    overlayPlanejador?.addEventListener("click", fecharModal);

    modalPlanejador?.addEventListener("click", (e) => e.stopPropagation());

    // --- BUSCA DE MÚSICAS ---
    async function carregarBancoDeMusicas() {
        const paginas = ['domingo1.html', 'domingo2.html', 'domingo3.html', 'domingo4.html', 'domingo5.html', 'extras.html'];
        for (let url of paginas) {
            try {
                const response = await fetch(url);
                if (!response.ok) continue;
                const htmlText = await response.text();
                const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                const cards = doc.querySelectorAll('.card-musica');
                cards.forEach(card => {
                    const titulo = card.querySelector('h3')?.textContent.trim() || "";
                    const letra = card.querySelector('p')?.innerHTML || ""; 
                    if (titulo) bancoDeMusicas.push({ titulo, letra });
                });
            } catch (err) { console.warn("Erro ao carregar: " + url); }
        }
    }

    // --- AUTOCOMPLETE ---
    const momentos = document.querySelectorAll(".momento-missa");

    momentos.forEach((momento) => {
        const inputMusica = momento.querySelector(".input-musica");
        const checkbox = momento.querySelector(".check-momento");
        const dropdown = document.createElement("div");
        dropdown.className = "autocomplete-resultados";
        inputMusica.parentNode.appendChild(dropdown);

        inputMusica.addEventListener("input", function() {
            const termo = this.value;
            dropdown.innerHTML = "";

            if (termo.length < 2) {
                dropdown.style.display = "none";
                return;
            }

            const termoNorm = normalizarTexto(termo);
            const filtradas = bancoDeMusicas.filter(m => 
                normalizarTexto(m.titulo).includes(termoNorm)
            );

            if (filtradas.length > 0) {
                dropdown.style.display = "block";
                filtradas.forEach(musica => {
                    const item = document.createElement("div");
                    item.className = "autocomplete-item";
                    item.textContent = musica.titulo;
                    item.addEventListener("mousedown", (e) => {
                        e.preventDefault();
                        inputMusica.value = musica.titulo;
                        inputMusica.setAttribute("data-letra", musica.letra);
                        if (checkbox) checkbox.checked = true; 
                        dropdown.style.display = "none";
                        salvarNoStorage();
                    });
                    dropdown.appendChild(item);
                });
            } else { dropdown.style.display = "none"; }
        });

        inputMusica.addEventListener("blur", () => {
            setTimeout(() => { dropdown.style.display = "none"; }, 200);
        });
    });

    // --- STORAGE ---
    function salvarNoStorage() {
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

    // AQUI O AJUSTE: 'change' captura cliques no checkbox e seleção de tom melhor que 'input'
    modalPlanejador?.addEventListener("change", salvarNoStorage);
    modalPlanejador?.addEventListener("input", salvarNoStorage);
    
    carregarDoStorage();

    btnPdf?.addEventListener("click", function() {
        salvarNoStorage();
        const pathSegments = window.location.pathname.split('/').filter(s => s !== "");
        const estaNaSubpasta = pathSegments.length > 0 && !window.location.pathname.endsWith('index.html');
        window.location.href = estaNaSubpasta ? "../gerar_pdf.html" : "gerar_pdf.html";
    });
});