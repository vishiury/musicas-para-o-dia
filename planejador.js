/**
 * PLANEJADOR DE REPERTÓRIO
 * Modal para planejar músicas da missa e gerar PDF
 */

(function() {
    'use strict';

    const btnPlanejador = document.getElementById('btn-planejador');
    const modal = document.getElementById('modal-planejador');
    const overlay = document.getElementById('overlay-planejador');
    const btnFechar = document.getElementById('fechar-planejador');
    const btnPrepararPDF = document.getElementById('btn-preparar-pdf');

    let musicasData = [];

    // Carregar dados de músicas
    fetch('../musicas.json')
        .then(res => res.json())
        .then(data => {
            musicasData = data;
        })
        .catch(err => console.error('Erro ao carregar músicas para planejador:', err));

    // Abrir modal
    if (btnPlanejador) {
        btnPlanejador.addEventListener('click', () => {
            if (modal && overlay) {
                modal.classList.add('ativo');
                overlay.classList.add('ativo');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    // Fechar modal
    function fecharModal() {
        if (modal && overlay) {
            modal.classList.remove('ativo');
            overlay.classList.remove('ativo');
            document.body.style.overflow = '';
        }
    }

    if (btnFechar) {
        btnFechar.addEventListener('click', fecharModal);
    }

    if (overlay) {
        overlay.addEventListener('click', fecharModal);
    }

    // ESC fecha modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('ativo')) {
            fecharModal();
        }
    });

    // Autocomplete nos inputs de música
    const inputsMusica = document.querySelectorAll('.input-musica');
    
    inputsMusica.forEach(input => {
        let autocompleteDiv = null;

        input.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            const categoria = this.getAttribute('data-categoria');

            // Remove autocomplete anterior
            removerAutocomplete();

            if (query.length < 2) return;

            // Filtra músicas pela categoria e query
            let resultados = musicasData.filter(musica => {
                const tituloMatch = musica.titulo.toLowerCase().includes(query);
                const categoriaMatch = !categoria || musica.categoria === categoria;
                return tituloMatch && categoriaMatch;
            });

            if (resultados.length === 0) return;

            // Cria div de autocomplete
            autocompleteDiv = document.createElement('div');
            autocompleteDiv.className = 'autocomplete-resultados';
            autocompleteDiv.style.display = 'block';

            resultados.slice(0, 5).forEach(musica => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = musica.titulo;
                
                item.addEventListener('click', () => {
                    input.value = musica.titulo;
                    removerAutocomplete();
                });

                autocompleteDiv.appendChild(item);
            });

            this.parentElement.style.position = 'relative';
            this.parentElement.appendChild(autocompleteDiv);
        });

        // Fechar autocomplete ao clicar fora
        input.addEventListener('blur', () => {
            setTimeout(removerAutocomplete, 200);
        });

        function removerAutocomplete() {
            if (autocompleteDiv && autocompleteDiv.parentElement) {
                autocompleteDiv.remove();
                autocompleteDiv = null;
            }
        }
    });

    // Preparar PDF
    if (btnPrepararPDF) {
        btnPrepararPDF.addEventListener('click', () => {
            const paroquia = document.getElementById('input-paroquia')?.value || '';
            const dataMissa = document.getElementById('input-data-missa')?.value || '';

            // Coletar músicas selecionadas
            const momentos = [];
            const checkboxes = document.querySelectorAll('.check-momento');

            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    const container = checkbox.closest('.momento-missa');
                    const label = container.querySelector('label').textContent;
                    const inputMusica = container.querySelector('.input-musica');
                    const inputTom = container.querySelector('.input-tom');

                    if (inputMusica && inputMusica.value.trim()) {
                        momentos.push({
                            momento: label,
                            musica: inputMusica.value.trim(),
                            tom: inputTom ? inputTom.value.trim() : ''
                        });
                    }
                }
            });

            if (momentos.length === 0) {
                alert('Por favor, selecione ao menos um momento e adicione uma música.');
                return;
            }

            // Gerar PDF (aqui você pode implementar a geração real)
            gerarPDF(paroquia, dataMissa, momentos);
        });
    }

    function gerarPDF(paroquia, dataMissa, momentos) {
        // Por enquanto, vamos apenas mostrar os dados no console
        console.log('Gerando PDF:', { paroquia, dataMissa, momentos });

        // Criar conteúdo simples
        let conteudo = `
PLANEJAMENTO DE REPERTÓRIO

${paroquia ? 'Paróquia: ' + paroquia : ''}
${dataMissa ? 'Missa: ' + dataMissa : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

        momentos.forEach(m => {
            conteudo += `${m.momento.toUpperCase()}\n`;
            conteudo += `${m.musica}`;
            if (m.tom) conteudo += ` — Tom: ${m.tom}`;
            conteudo += '\n\n';
        });

        conteudo += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gerado em: ${new Date().toLocaleDateString('pt-BR')}
Músicas para o Dia · musicasparaodi.com.br
`;

        // Criar blob de texto
        const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Repertorio_${dataMissa.replace(/\s+/g, '_') || 'Missa'}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        // Mensagem de sucesso
        alert('Arquivo de texto gerado! Para um PDF profissional, considere copiar este conteúdo para um editor de documentos.');
        
        // Fechar modal
        fecharModal();
    }

})();
