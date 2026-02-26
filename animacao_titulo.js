document.addEventListener("DOMContentLoaded", function() {
    const titulo = document.getElementById("titulo-agitado");
    const texto = titulo.textContent;
    titulo.textContent = "";

    [...texto].forEach((caractere) => {
        const letraSpan = document.createElement("span");
        
        if (caractere === " ") {
            letraSpan.innerHTML = "&nbsp;";
        } else {
            letraSpan.textContent = caractere;
            letraSpan.className = "letra-agitada";

            // Atraso aleatório para que cada letra flutue em um ritmo diferente
            letraSpan.style.animationDelay = `${(Math.random() * -5).toFixed(2)}s`;

            // DURAÇÃO: Agora cada ciclo leva entre 3 e 5 segundos (bem mais lento)
            const velocidadeSuave = (3 + Math.random() * 2).toFixed(2);
            letraSpan.style.animationDuration = `${velocidadeSuave}s`;
        }

        titulo.appendChild(letraSpan);
    });
});