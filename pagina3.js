let mostrandoCheckboxes = false;

document.addEventListener('DOMContentLoaded', () => {
    renderizarVerificacao();

    // Lógica do Botão de Mostrar Caixas de Seleção (Modo Gradual)
    document.getElementById('btnAtivarGradual').addEventListener('click', () => {
        mostrandoCheckboxes = !mostrandoCheckboxes;
        renderizarVerificacao();
    });

    // Lógica do Botão Resetar Tudo
    document.getElementById('btnResetar').addEventListener('click', () => {
        if(confirm("⚠️ ATENÇÃO: Isso vai desfazer TODOS os pagamentos desta página e restaurar itens excluídos. Deseja continuar?")) {
            let gastos = JSON.parse(localStorage.getItem('gastosPagina2')) || [];
            
            // Limpa o histórico de todos os itens
            gastos.forEach(g => {
                g.pagamentosFeitos = []; // Zera pagamentos
                g.modoPagamento = 'fixo'; // Volta ao padrão
                g.valorParcela = 0;
                g.ocultoPag3 = false; // Restaura os excluídos
                g.dataPagamento = null;
            });
            
            localStorage.setItem('gastosPagina2', JSON.stringify(gastos));
            mostrandoCheckboxes = false; // Esconde as caixas
            renderizarVerificacao();
        }
    });
});

function renderizarVerificacao() {
    const listaContainer = document.getElementById('listaVerificacao');
    listaContainer.innerHTML = '';

    let gastosPagina2 = JSON.parse(localStorage.getItem('gastosPagina2')) || [];

    // Filtra os itens que não foram excluídos (ocultados) desta página
    let gastosVisiveis = gastosPagina2.filter(g => !g.ocultoPag3);

    if (gastosVisiveis.length === 0) {
        listaContainer.innerHTML = '<p style="text-align: center; color: #888;">Nenhuma previsão disponível ou todas foram excluídas.</p>';
        return;
    }

    // Muda o texto do botão do topo dependendo do estado
    const btnAtivar = document.getElementById('btnAtivarGradual');
    btnAtivar.textContent = mostrandoCheckboxes ? '❌ Concluir Seleção' : '🔄 Selecionar Graduais';
    btnAtivar.className = mostrandoCheckboxes ? 'btn-topo cinza' : 'btn-topo azul';

    gastosPagina2.forEach((gasto, index) => {
        if (gasto.ocultoPag3) return; // Pula os que o usuário apagou da lista

        // Inicializa variáveis caso seja a primeira vez abrindo a página
        if (!gasto.pagamentosFeitos) gasto.pagamentosFeitos = [];
        if (!gasto.modoPagamento) gasto.modoPagamento = 'fixo';
        if (gasto.valorParcela === undefined) gasto.valorParcela = 0;

        const valorTotal = parseFloat(gasto.valor);
        const totalPago = gasto.pagamentosFeitos.reduce((a, b) => a + b, 0);
        let diferenca = valorTotal - totalPago;
        let estaPago = diferenca <= 0;

        if (estaPago) {
            diferenca = 0;
            if (!gasto.dataPagamento) gasto.dataPagamento = new Date().toLocaleDateString('pt-BR');
        } else {
            gasto.dataPagamento = null;
        }

        const linha = document.createElement('div');
        linha.className = `linha-verificacao ${estaPago ? 'linha-cinza' : ''}`;

        // 1. Checkbox do Modo Gradual (Aparece se o botão do topo for clicado)
        if (mostrandoCheckboxes && !estaPago) {
            const divCheck = document.createElement('div');
            divCheck.className = 'checkbox-container';
            
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'checkbox-gradual';
            cb.checked = gasto.modoPagamento === 'gradual';
            
            cb.addEventListener('change', (e) => {
                if (e.target.checked) {
                    let parcela = prompt(`Ativando modo gradual para "${gasto.descricao}".\nQual será o valor pago por vez?`);
                    parcela = parseFloat(parcela);
                    if (!isNaN(parcela) && parcela > 0) {
                        gasto.modoPagamento = 'gradual';
                        gasto.valorParcela = parcela;
                        salvarEAtualizar(gastosPagina2);
                    } else {
                        e.target.checked = false; // Cancela se não puser valor válido
                    }
                } else {
                    gasto.modoPagamento = 'fixo';
                    gasto.valorParcela = 0;
                    salvarEAtualizar(gastosPagina2);
                }
            });
            divCheck.appendChild(cb);
            linha.appendChild(divCheck);
        }

        // 2. Botão Principal de Pagar
        const btnPagar = document.createElement('button');
        btnPagar.className = estaPago ? 'btn-pagar-oculto' : 'btn-pagar-acao';
        btnPagar.textContent = gasto.modoPagamento === 'fixo' ? 'Pagar Tudo' : `Pagar R$ ${gasto.valorParcela}`;
        
        // Se estiver em modo gradual, muda a cor para diferenciar
        if (gasto.modoPagamento === 'gradual' && !estaPago) {
            btnPagar.style.backgroundColor = '#ffc107';
            btnPagar.style.color = '#333';
        }

        btnPagar.addEventListener('click', () => {
            if (gasto.modoPagamento === 'fixo') {
                gasto.pagamentosFeitos.push(diferenca); // Abate todo o resto
            } else {
                // Abate a parcela (mas não deixa passar do valor total)
                let valorParaAbater = Math.min(gasto.valorParcela, diferenca);
                gasto.pagamentosFeitos.push(valorParaAbater); 
            }
            salvarEAtualizar(gastosPagina2);
        });
        if (!estaPago) linha.appendChild(btnPagar);

        // 3. Informações (Textos)
        const divInfo = document.createElement('div');
        divInfo.className = 'info-verificacao';

        if (estaPago) {
            divInfo.innerHTML = `
                <span class="data-paga-texto">Pago em: ${gasto.dataPagamento}</span>
                <span class="desc-texto">${gasto.descricao}</span>
                <span class="valor-texto">Total: R$ ${valorTotal.toFixed(2)}</span>
            `;
        } else {
            divInfo.innerHTML = `
                <span class="falta-texto">Faltam: <strong>R$ ${diferenca.toFixed(2)}</strong></span>
                <span class="desc-texto">${gasto.descricao}</span>
                <span class="valor-texto">Previsto: R$ ${valorTotal.toFixed(2)}</span>
            `;
        }
        linha.appendChild(divInfo);

        // 4. Área de Botões (Fim da Linha)
        const divBotoes = document.createElement('div');
        divBotoes.className = 'botoes-finais';

        // Botão Desfazer Pagamento (Aparece se já tiver algum pagamento feito)
        if (gasto.pagamentosFeitos.length > 0) {
            const btnDesfazer = document.createElement('button');
            btnDesfazer.className = 'btn-acao btn-desfazer';
            btnDesfazer.textContent = '↩️ Desfazer';
            btnDesfazer.addEventListener('click', () => {
                gasto.pagamentosFeitos.pop(); // Remove o último pagamento da lista
                salvarEAtualizar(gastosPagina2);
            });
            divBotoes.appendChild(btnDesfazer);
        }

        // Botão Editar Data (Só para itens pagos)
        if (estaPago) {
            const btnEditData = document.createElement('button');
            btnEditData.className = 'btn-acao btn-editar-data';
            btnEditData.textContent = '📅 Editar Data';
            btnEditData.addEventListener('click', () => {
                const novaData = prompt("Corrigir data de pagamento (DD/MM/AAAA):", gasto.dataPagamento);
                if (novaData) {
                    gasto.dataPagamento = novaData;
                    salvarEAtualizar(gastosPagina2);
                }
            });
            divBotoes.appendChild(btnEditData);
        }

        // Botão Excluir da Lista (Apenas oculta, não apaga da Página 2)
        const btnExcluir = document.createElement('button');
        btnExcluir.className = 'btn-acao btn-apagar';
        btnExcluir.textContent = '❌ Excluir';
        btnExcluir.addEventListener('click', () => {
            if(confirm(`Tem certeza que deseja ocultar "${gasto.descricao}" desta verificação? (Pode ser desfeito no botão Resetar Tudo)`)) {
                gasto.ocultoPag3 = true;
                salvarEAtualizar(gastosPagina2);
            }
        });
        divBotoes.appendChild(btnExcluir);

        linha.appendChild(divBotoes);
        listaContainer.appendChild(linha);
    });
}

function salvarEAtualizar(gastosPagina2) {
    localStorage.setItem('gastosPagina2', JSON.stringify(gastosPagina2));
    renderizarVerificacao();
}

// --- Lógica do Menu Hambúrguer e Animação do X ---
document.addEventListener('DOMContentLoaded', () => {
    const btnMenu = document.getElementById('btnMenu');
    const menuDropdown = document.getElementById('menuDropdown');

    if (btnMenu && menuDropdown) {
        // Abre/fecha menu e anima hambúrguer para X
        btnMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            btnMenu.classList.toggle('ativo');
            menuDropdown.classList.toggle('ativo');
        });

        // Fecha o menu e reseta o ícone ao clicar fora
        document.addEventListener('click', () => {
            if (menuDropdown.classList.contains('ativo')) {
                btnMenu.classList.remove('ativo');
                menuDropdown.classList.remove('ativo');
            }
        });
    }
});
