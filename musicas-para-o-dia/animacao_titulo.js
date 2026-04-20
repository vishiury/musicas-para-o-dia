/**
 * animacao_titulo.js
 * Animação do título principal — versão corrigida e aprimorada
 * 
 * CORREÇÕES:
 *  - Removido do <head>: agora carregado com `defer` no final do <body>
 *  - Não trava o carregamento da página
 *  - Efeito de brilho pulsante nas letras douradas
 */

document.addEventListener('DOMContentLoaded', () => {
    const titulo = document.getElementById('titulo-agitado');
    if (!titulo) return;

    // Efeito de shimmer dourado nas linhas do título ao passar o mouse
    titulo.addEventListener('mousemove', (e) => {
        const rect = titulo.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        titulo.style.setProperty('--shine-x', `${x}%`);
        titulo.style.setProperty('--shine-y', `${y}%`);
    });

    titulo.addEventListener('mouseleave', () => {
        titulo.style.removeProperty('--shine-x');
        titulo.style.removeProperty('--shine-y');
    });
});
