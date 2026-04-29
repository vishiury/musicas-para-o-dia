document.addEventListener("DOMContentLoaded", function () {
    const btnPlanejador = document.getElementById("btn-planejador");
    const modalPlanejador = document.getElementById("modal-planejador");
    const overlayPlanejador = document.getElementById("overlay-planejador");
    const btnFechar = document.getElementById("fechar-planejador");
    const btnPdf = document.getElementById("btn-preparar-pdf");

    let bancoDeMusicas = [];
    let resultadosDiv = null;

    function normalizarTexto(texto) {
        return (texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function abrirModal() {
        if (modalPlanejador && overlayPlanejador) {
            modalPlanejador.classList.add("ativo");
            overlayPlanejador.classList.add("ativo");
            document.body.style.overflow = "hidden";
            if (bancoDeMusicas.length === 0) carregarDados();
        }
    }

    function fecharModal() {
        if (modalPlanejador) modalPlanejador.classList.remove("ativo");
        if (overlayPlanejador) overlayPlanejador.classList.remove("ativo");
        document.body.style.overflow = "auto";
        if (resultadosDiv) resultadosDiv.style.display = "none";
    }

    btnPlanejador?.addEventListener("click", abrirModal);
    btnFechar?.addEventListener("click", fecharModal);
    // 1. O fundo escuro só fecha se você clicar EXATAMENTE nele (e não nos filhos dele)
overlayPlanejador?.addEventListener("click", function(event) {
    if (event.target === overlayPlanejador) {
        fecharModal();
    }
});

// 2. Trava de segurança: impede que qualquer clique dentro do modal vaze para fora
modalPlanejador?.addEventListener("click", function(event) {
    event.stopPropagation(); 
});

    async function carregarDados() {
        try {
            const estaNaSubpasta = window.location.pathname.includes("/quaresma/") || window.location.pathname.includes("/pascoa/");
            const path = estaNaSubpasta ? "../musicas.json" : "musicas.json";
            const res = await fetch(path);
            if (!res.ok) throw new Error("Erro json");
            bancoDeMusicas = await res.json();
        } catch (e) {
            console.error(e);
        }
    }

    const inputsMusica = document.querySelectorAll(".input-musica");

    inputsMusica.forEach((input) => {
        input.addEventListener("input", debounce(function () {
            const termo = normalizarTexto(this.value);
            const categoriaAlvo = this.getAttribute("data-categoria");
            const inputAtual = this;

            if (!resultadosDiv) {
                resultadosDiv = document.createElement("div");
                resultadosDiv.className = "sugestoes-planejador";
                document.body.appendChild(resultadosDiv);
            }

            resultadosDiv.innerHTML = "";

            if (termo.length < 2) {
                resultadosDiv.style.display = "none";
                return;
            }

            const filtrados = bancoDeMusicas.filter((m) => {
                return normalizarTexto(m.titulo).includes(termo) && m.categoria === categoriaAlvo;
            });

            if (filtrados.length > 0) {
                const rect = this.getBoundingClientRect();
                resultadosDiv.style.top = `${rect.bottom + window.scrollY}px`;
                resultadosDiv.style.left = `${rect.left}px`;
                resultadosDiv.style.width = `${rect.width}px`;
                resultadosDiv.style.display = "block";

                filtrados.forEach((musica) => {
                    const item = document.createElement("div");
                    item.className = "item-sugestao";
                    item.innerHTML = `<strong>${musica.titulo}</strong>`;

                    item.onclick = () => {
                        inputAtual.value = musica.titulo;
                        
                        // SALVANDO O LINK E A LETRA NO HTML INVISÍVEL
                        inputAtual.setAttribute("data-letra", musica.letra || "");
                        inputAtual.setAttribute("data-link", musica.link || "");

                        resultadosDiv.style.display = "none";
                        salvarNoStorage();
                    };
                    resultadosDiv.appendChild(item);
                });
            } else {
                resultadosDiv.style.display = "none";
            }
        }, 300));
    });

    document.addEventListener("click", function (e) {
        if (resultadosDiv && !e.target.classList.contains("input-musica")) {
            resultadosDiv.style.display = "none";
        }
    });

    function salvarNoStorage() {
    const momentos = document.querySelectorAll(".momento-missa");
    const dados = Array.from(momentos).map((m) => {
        const input = m.querySelector(".input-musica");
        return {
            check: m.querySelector(".check-momento").checked,
            musica: input.value,
            tom: m.querySelector(".input-tom").value,
            letra: input.getAttribute("data-letra") || "",
            // 👇 ESSA LINHA É A MAIS IMPORTANTE! É ELA QUE ESTAVA FALTANDO ANTES:
            link: input.getAttribute("data-link") || "" 
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
                input.value = salvos[i].musica || "";
                m.querySelector(".input-tom").value = salvos[i].tom || "";
                input.setAttribute("data-letra", salvos[i].letra || "");
                input.setAttribute("data-link", salvos[i].link || "");
            }
        });
    }

    carregarDoStorage();

    document.querySelectorAll(".check-momento").forEach((cb) => cb.addEventListener("change", salvarNoStorage));
    document.querySelectorAll(".input-tom").forEach((input) => input.addEventListener("input", debounce(salvarNoStorage, 500)));

    btnPdf?.addEventListener("click", function () {
        salvarNoStorage();
        const estaNaSubpasta = window.location.pathname.includes("/quaresma/") || window.location.pathname.includes("/pascoa/");
        window.location.href = estaNaSubpasta ? "../gerar_pdf.html" : "gerar_pdf.html";
    });
        // --- LÓGICA DO CABEÇALHO DO PDF ---
    const inputParoquia = document.getElementById("input-paroquia");
    const inputDataMissa = document.getElementById("input-data-missa");

    function salvarCabecalho() {
        const cabecalho = {
            paroquia: inputParoquia ? inputParoquia.value : "",
            dataMissa: inputDataMissa ? inputDataMissa.value : ""
        };
        localStorage.setItem("meuCabecalhoMissa", JSON.stringify(cabecalho));
    }

    // Carrega o que já estava escrito quando abre o site
    const cabecalhoSalvo = JSON.parse(localStorage.getItem("meuCabecalhoMissa") || "{}");
    if (inputParoquia) inputParoquia.value = cabecalhoSalvo.paroquia || "";
    if (inputDataMissa) inputDataMissa.value = cabecalhoSalvo.dataMissa || "";

    // Salva automaticamente enquanto você digita
    inputParoquia?.addEventListener("input", debounce(salvarCabecalho, 500));
    inputDataMissa?.addEventListener("input", debounce(salvarCabecalho, 500));
});