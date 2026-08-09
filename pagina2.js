let gastosPagina2 = [];
let tabelaAtual = 1; // Começa sempre apontando para a Tabela 1
let saldoTotalPagina1 = 0;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Calcula o saldo guardado na Página 1 (O Saldo Real)
    const dadosPagina1 = localStorage.getItem('meusGastos');
    if (dadosPagina1) {
        const gastos1 = JSON.parse(dadosPagina1);
        gastos1.forEach(gasto => {
            if (gasto.tipo === 'entrada') {
                saldoTotalPagina1 += parseFloat(gasto.valor);
            } else {
                saldoTotalPagina1 -= parseFloat(gasto.valor);
            }
        });
    }

    // 2. Puxa os dados salvos exclusivamente da Página 2
    const dadosPagina2 = localStorage.getItem('gastosPagina2');
    if (dadosPagina2) {
        gastosPagina2 = JSON.parse(dadosPagina2);
    }

    renderizarTabelas();
});

// 3. Lógica do botão redondo (Alternar 1 e 2)
const btnTipoTabela = document.getElementById('btnTipoTabela');
const inputValor2 = document.getElementById('valor2');

btnTipoTabela.addEventListener('click', () => {
    if (tabelaAtual === 1) {
        tabelaAtual = 2;
        btnTipoTabela.textContent = '2';
        btnTipoTabela.classList.replace('tabela1', 'tabela2');
        inputValor2.classList.replace('texto-azul', 'texto-roxo');
    } else {
        tabelaAtual = 1;
        btnTipoTabela.textContent = '1';
        btnTipoTabela.classList.replace('tabela2', 'tabela1');
        inputValor2.classList.replace('texto-roxo', 'texto-azul');
    }
});

// 4. Botão Registrar Gasto da Página 2
document.getElementById('btnRegistrar2').addEventListener('click', () => {
    const inputDescricao = document.getElementById('descricao2');
    const descricao = inputDescricao.value.trim();
    const valor = inputValor2.value;

    if (descricao === '' || valor === '') {
        alert('Por favor, preencha ambos os campos!');
        return;
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    gastosPagina2.push({
        data: dataAtual, // Mantemos a data salva no sistema, mas não mostramos na tabela
        descricao: descricao,
        valor: parseFloat(valor).toFixed(2),
        tabela: tabelaAtual,
        pagamentosFeitos: [], // Prepara para a Página 3
        modoPagamento: 'fixo',
        valorParcela: 0
    });

    salvarDadosPagina2();
    renderizarTabelas();

    inputDescricao.value = '';
    inputValor2.value = '';
    inputDescricao.focus();
});

function salvarDadosPagina2() {
    localStorage.setItem('gastosPagina2', JSON.stringify(gastosPagina2));
}

// 5. Renderizar as duas tabelas e fazer a matemática
function renderizarTabelas() {
    const tb1 = document.getElementById('tabela1HTML').getElementsByTagName('tbody')[0];
    const tb2 = document.getElementById('tabela2HTML').getElementsByTagName('tbody')[0];
    
    tb1.innerHTML = '';
    tb2.innerHTML = '';

    let somaTab1 = 0;
    let somaTab2 = 0;

    gastosPagina2.forEach((gasto, index) => {
        const valorGasto = parseFloat(gasto.valor);
        let tabelaDestino;

        // Cálculos de Pagamento (Puxando da Página 3 apenas para visualização)
        let pagamentos = gasto.pagamentosFeitos || [];
        let totalPago = pagamentos.reduce((a, b) => a + b, 0);
        let diferenca = valorGasto - totalPago;
        if (diferenca < 0) diferenca = 0;

        // SOMA SEMPRE O VALOR TOTAL PREVISTO nas suas respectivas tabelas (ignorando se já foi pago ou não)
        if (gasto.tabela === 1) {
            somaTab1 += valorGasto; 
            tabelaDestino = tb1;
        } else {
            somaTab2 += valorGasto;
            tabelaDestino = tb2;
        }

        const novaLinha = tabelaDestino.insertRow();
        const colunaStatus = novaLinha.insertCell(0); // Antiga coluna Data
        const colunaDescricao = novaLinha.insertCell(1);
        const colunaValor = novaLinha.insertCell(2);
        const colunaAcoes = novaLinha.insertCell(3);

        // Define o texto do Status
        if (diferenca === 0 && (totalPago > 0 || gasto.modoPagamento === 'fixo' && gasto.dataPagamento)) {
            colunaStatus.innerHTML = '<span style="color: #28a745; font-weight: bold;">Pago</span>';
        } else if (totalPago > 0) {
            colunaStatus.innerHTML = `<span style="color: #dc3545; font-size: 14px;">Falta R$ ${diferenca.toFixed(2)}</span>`;
        } else {
            colunaStatus.innerHTML = `<span style="color: #666; font-size: 14px;">Falta R$ ${valorGasto.toFixed(2)}</span>`;
        }

        colunaDescricao.textContent = gasto.descricao;
        colunaValor.textContent = `R$ ${valorGasto.toFixed(2)}`;
        
        if (gasto.tabela === 1) {
            colunaValor.classList.add('texto-azul');
        } else {
            colunaValor.classList.add('texto-roxo');
        }

        const divAcoes = document.createElement('div');
        divAcoes.className = 'acoes-container';

        const botaoApagar = document.createElement('button');
        botaoApagar.textContent = 'Apagar';
        botaoApagar.className = 'btn-apagar';
        
        botaoApagar.addEventListener('click', function() {
            if(confirm("Tem certeza que deseja apagar este registro?")) {
                gastosPagina2.splice(index, 1); 
                salvarDadosPagina2();           
                renderizarTabelas();      
            }
        });

        divAcoes.appendChild(botaoApagar);
        colunaAcoes.appendChild(divAcoes);
    });

    // --- A NOVA MATEMÁTICA DA ABA DE RESUMO ---
    
    const valSaldo = saldoTotalPagina1; 
    const valJunto = valSaldo - somaTab1;
    const valAcrescimo = valJunto - somaTab2;

    const pSaldo1 = document.getElementById('saldo1');
    const pSaldo2 = document.getElementById('saldo2');
    const pSaldo3 = document.getElementById('saldo3');

    pSaldo1.textContent = `R$ ${valSaldo.toFixed(2)}`;
    pSaldo2.textContent = `R$ ${valJunto.toFixed(2)}`;
    pSaldo3.textContent = `R$ ${valAcrescimo.toFixed(2)}`;

    pSaldo1.className = valSaldo >= 0 ? 'texto-verde' : 'texto-vermelho';
    pSaldo2.className = valJunto >= 0 ? 'texto-verde' : 'texto-vermelho';
    pSaldo3.className = valAcrescimo >= 0 ? 'texto-verde' : 'texto-vermelho';
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
