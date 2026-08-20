document.addEventListener('DOMContentLoaded', () => {
    const inputDinheiro = document.getElementById('dinheiroInicial');
    const btnSalvar = document.getElementById('btnRegistrarConfig');
    const btnResetar = document.getElementById('btnResetarConfig');
    
    const toast = document.getElementById('toastNotificacao');
    const toastMensagem = document.getElementById('toastMensagem');
    let toastTimeout; // Variável para controlar o tempo da notificação

    // 1. Puxar valor original ao carregar
    let valorSalvoOriginal = localStorage.getItem('dinheiroInicial') || '';

    if (valorSalvoOriginal) {
        inputDinheiro.value = parseFloat(valorSalvoOriginal).toFixed(2);
    }

    // 2. Função que liga/desliga o botão conforme você digita
    function checarMudancas() {
        let valorAtual = inputDinheiro.value;
        
        // Converte os dois para número para comparar direitinho (Ex: "500" vira igual a "500.00")
        let numAtual = valorAtual === '' ? '' : parseFloat(valorAtual);
        let numSalvo = valorSalvoOriginal === '' ? '' : parseFloat(valorSalvoOriginal);

        // Se os valores forem iguais, o botão fica desativado
        if (numAtual === numSalvo) {
            btnSalvar.disabled = true;
        } else {
            btnSalvar.disabled = false;
        }
    }

    // Fica de olho em tudo que é digitado no input
    inputDinheiro.addEventListener('input', checarMudancas);

    // 3. Função que chama a animação da notificação
    function mostrarNotificacao(mensagem) {
        toastMensagem.textContent = mensagem;
        toast.classList.add('mostrar');

        // Se já tiver uma notificação sumindo, cancela pra mostrar a nova
        clearTimeout(toastTimeout);
        
        // Esconde suavemente após 3 segundos
        toastTimeout = setTimeout(() => {
            toast.classList.remove('mostrar');
        }, 3000);
    }

    // 4. Ação do Botão Salvar
    btnSalvar.addEventListener('click', () => {
        const novoValor = parseFloat(inputDinheiro.value) || 0;
        
        // Salva no banco do navegador
        localStorage.setItem('dinheiroInicial', novoValor);
        
        // Atualiza a memória para o novo valor
        valorSalvoOriginal = inputDinheiro.value; 
        
        // O botão fez o trabalho, então desativa ele de novo
        btnSalvar.disabled = true;

        mostrarNotificacao("Configurações salvas!");
    });

    // 5. Ação do Botão Resetar
    btnResetar.addEventListener('click', () => {
        // Salva como zero 
        localStorage.setItem('dinheiroInicial', 0);
        
        // Limpa o campo da tela
        inputDinheiro.value = '';
        valorSalvoOriginal = '';

        // Botão salvar desativado pois já está salvo como zero
        btnSalvar.disabled = true;

        mostrarNotificacao("Saldo zerado!");
    });
});
            
