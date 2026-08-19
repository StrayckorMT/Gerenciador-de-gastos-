document.addEventListener('DOMContentLoaded', () => {
    const inputDinheiro = document.getElementById('dinheiroInicial');
    const btnSalvar = document.getElementById('btnRegistrarConfig');

    // Quando a página carrega, verifica se já existe um valor salvo
    const valorSalvo = localStorage.getItem('dinheiroInicial');
    if (valorSalvo) {
        inputDinheiro.value = parseFloat(valorSalvo).toFixed(2);
    }

    // Ação de salvar ao clicar no botão
    btnSalvar.addEventListener('click', () => {
        const novoValor = parseFloat(inputDinheiro.value) || 0;
        localStorage.setItem('dinheiroInicial', novoValor);
        
        // Dá um feedback visual rápido
        btnSalvar.textContent = "✔ Salvo com sucesso!";
        btnSalvar.style.backgroundColor = "#218838"; // Cor verde mais escura
        
        setTimeout(() => {
            btnSalvar.textContent = "Salvar Configurações";
            btnSalvar.style.backgroundColor = ""; // Remove a cor fixa para voltar a usar o CSS padrão
        }, 2000);
    });
});
                               
