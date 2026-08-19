let gastos = [];
let tipoAtual = 'saida'; // Define vermelho (despesa) como padrão ao abrir

// 1. Carrega os dados salvos
document.addEventListener('DOMContentLoaded', () => {
    const dadosSalvos = localStorage.getItem('meusGastos');
    if (dadosSalvos) {
        gastos = JSON.parse(dadosSalvos); 
        renderizarTabela(); 
    }
});

// 2. Lógica do botão redondo (Alternar Entrada/Saída)
const btnTipoValor = document.getElementById('btnTipoValor');
const inputValor = document.getElementById('valor');

btnTipoValor.addEventListener('click', () => {
    if (tipoAtual === 'saida') {
        tipoAtual = 'entrada';
        btnTipoValor.classList.replace('saida', 'entrada');
        inputValor.classList.replace('texto-vermelho', 'texto-verde');
    } else {
        tipoAtual = 'saida';
        btnTipoValor.classList.replace('entrada', 'saida');
        inputValor.classList.replace('texto-verde', 'texto-vermelho');
    }
});

// 3. Adicionar Gasto
document.getElementById('btnRegistrar').addEventListener('click', adicionarGasto);

function adicionarGasto() {
    const inputDescricao = document.getElementById('descricao');
    const descricao = inputDescricao.value.trim();
    const valor = inputValor.value;

    if (descricao === '' || valor === '') {
        alert('Por favor, preencha ambos os campos!');
        return;
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Adiciona o novo gasto, agora salvando a cor/tipo junto
    gastos.push({
        data: dataAtual,
        descricao: descricao,
        valor: parseFloat(valor).toFixed(2),
        tipo: tipoAtual // 'entrada' ou 'saida'
    });

    salvarDados();
    renderizarTabela();

    inputDescricao.value = '';
    inputValor.value = '';
    inputDescricao.focus();
}

function salvarDados() {
    localStorage.setItem('meusGastos', JSON.stringify(gastos));
}

// 4. Desenhar a Tabela e Calcular Resumo
function renderizarTabela() {
    const tabela = document.getElementById('tabelaGastos').getElementsByTagName('tbody')[0];
    tabela.innerHTML = ''; 

        // Puxa o dinheiro inicial salvo nas configurações (se não tiver nada, é 0)
    let dinheiroInicial = parseFloat(localStorage.getItem('dinheiroInicial')) || 0;
    
    // Inicia a matemática baseada no dinheiro inicial em vez de zero
    let saldoTotal = dinheiroInicial; 

    gastos.forEach((gasto, index) => {
        // Cálculo do saldo base
        if (gasto.tipo === 'entrada') {
            saldoTotal += parseFloat(gasto.valor);
        } else {
            saldoTotal -= parseFloat(gasto.valor);
        }

        const novaLinha = tabela.insertRow();
        const colunaData = novaLinha.insertCell(0);
        const colunaDescricao = novaLinha.insertCell(1);
        const colunaValor = novaLinha.insertCell(2);
        const colunaAcoes = novaLinha.insertCell(3);

        colunaData.textContent = gasto.data;
        colunaDescricao.textContent = gasto.descricao;
        colunaValor.textContent = `R$ ${gasto.valor}`;

        // Aplica a cor correta na tabela de registros
        if (gasto.tipo === 'entrada') {
            colunaValor.classList.add('texto-verde');
        } else {
            colunaValor.classList.add('texto-vermelho');
        }

        const divAcoes = document.createElement('div');
        divAcoes.className = 'acoes-container';

        // Botão de Editar Data
        const botaoEditar = document.createElement('button');
        botaoEditar.textContent = 'Editar';
        botaoEditar.className = 'btn-editar';
        
        botaoEditar.addEventListener('click', function() {
            if (colunaData.querySelector('input')) return;

            const partesData = gasto.data.split('/');
            let dataFormatada = '';
            if (partesData.length === 3) {
                dataFormatada = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
            }

            const inputData = document.createElement('input');
            inputData.type = 'date';
            inputData.value = dataFormatada;
            inputData.className = 'input-editar-data';

            colunaData.textContent = '';
            colunaData.appendChild(inputData);
            inputData.focus();

            function salvarNovaData() {
                if (inputData.value) {
                    const novasPartes = inputData.value.split('-');
                    gastos[index].data = `${novasPartes[2]}/${novasPartes[1]}/${novasPartes[0]}`;
                }
                salvarDados();
                renderizarTabela();
            }

            inputData.addEventListener('blur', salvarNovaData);
            inputData.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') salvarNovaData();
            });
        });

        // Botão de Apagar
        const botaoApagar = document.createElement('button');
        botaoApagar.textContent = 'Apagar';
        botaoApagar.className = 'btn-apagar';
        
        botaoApagar.addEventListener('click', function() {
            if(confirm("Tem certeza que deseja apagar este registro?")) {
                gastos.splice(index, 1); 
                salvarDados();           
                renderizarTabela();      
            }
        });

        divAcoes.appendChild(botaoEditar);
        divAcoes.appendChild(botaoApagar);
        colunaAcoes.appendChild(divAcoes);
    });

    // --- CÁLCULO DE DEDUÇÃO PARA O PAINEL DE SALDO ---
    let previsaoTab1 = 0;
    let previsaoTab2 = 0;
    
    // Puxa as previsões para calcular o desconto total previsto (independente de estar pago ou não)
    const previsoes = JSON.parse(localStorage.getItem('gastosPagina2')) || [];
    previsoes.forEach(prev => {
        let valorTotalPrevisto = parseFloat(prev.valor);
        
        if (prev.tabela === 1) {
            previsaoTab1 += valorTotalPrevisto;
        } else {
            previsaoTab2 += valorTotalPrevisto;
        }
    });

    const valorJunto = saldoTotal - previsaoTab1;
    const valorAcrescimo = valorJunto - previsaoTab2;

    // Atualizar as 3 colunas de Resumo com a matemática de cascata
    const pSaldo1 = document.getElementById('saldo1');
    const pSaldo2 = document.getElementById('saldo2');
    const pSaldo3 = document.getElementById('saldo3');

    pSaldo1.textContent = `R$ ${saldoTotal.toFixed(2)}`;
    pSaldo2.textContent = `R$ ${valorJunto.toFixed(2)}`;
    pSaldo3.textContent = `R$ ${valorAcrescimo.toFixed(2)}`;

    // Altera a cor se for positivo (verde) ou negativo (vermelho)
    pSaldo1.className = saldoTotal >= 0 ? 'texto-verde' : 'texto-vermelho';
    pSaldo2.className = valorJunto >= 0 ? 'texto-verde' : 'texto-vermelho';
    pSaldo3.className = valorAcrescimo >= 0 ? 'texto-verde' : 'texto-vermelho';
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
