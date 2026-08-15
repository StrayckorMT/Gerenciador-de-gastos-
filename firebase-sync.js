// Importações modulares do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ⚠️ SUBSTITUA PELAS CHAVES DO SEU PROJETO FIREBASE AQUI
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let usuarioAtual = null;
let baixandoDados = false; // Trava de segurança para não reenviar os dados enquanto baixa

// ==========================================
// 1. LÓGICA DA INTERFACE (BOTÃO DO MENU)
// ==========================================
const btnSync = document.getElementById('btn-login-sync');

if (btnSync) {
  btnSync.addEventListener('click', () => {
    if (usuarioAtual) {
      // Se já tem usuário, o clique faz Logout
      if(confirm("Deseja sair da sua conta? O app continuará funcionando offline.")) {
        signOut(auth);
      }
    } else {
      // Se não tem, abre a janela do Google
      signInWithPopup(auth, provider).catch(erro => {
        console.error("Erro no login:", erro);
        alert("Não foi possível fazer o login.");
      });
    }
  });
}

// ==========================================
// 2. MONITOR DE ESTADO (QUANDO LOGA OU DESLOGA)
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    usuarioAtual = user;
    if (btnSync) btnSync.innerHTML = `✅ Sair (${user.email.split('@')[0]})`;
    
    // Quando loga, vamos buscar os dados na nuvem para ver se é um celular novo
    baixandoDados = true;
    try {
      const docRef = doc(db, "usuarios", user.uid, "backup", "meus_gastos");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const dadosNuvem = docSnap.data();
        let precisaRecarregar = false;
        
        // Pega cada dado da nuvem e injeta no celular
        for (const [chave, valor] of Object.entries(dadosNuvem)) {
          if (chave !== 'ultima_sincronizacao') {
            // Se o dado não existir no celular, nós injetamos
            if (localStorage.getItem(chave) !== valor) {
               originalSetItem.call(localStorage, chave, valor);
               precisaRecarregar = true;
            }
          }
        }
        
        if (precisaRecarregar) {
          alert("Backup encontrado! A página vai recarregar para exibir seus gastos.");
          window.location.reload();
        }
      }
    } catch (e) {
      console.error("Erro ao puxar dados:", e);
    } finally {
      baixandoDados = false;
    }

  } else {
    usuarioAtual = null;
    if (btnSync) btnSync.innerHTML = "☁️ Sincronizar com Google";
  }
});

// ==========================================
// 3. O INTERCEPTADOR MÁGICO DO LOCALSTORAGE
// ==========================================
const originalSetItem = localStorage.setItem;

localStorage.setItem = async function(chave, valor) {
  // Salva no celular normalmente (mantém o offline funcionando)
  originalSetItem.apply(this, arguments);

  // Se o usuário estiver logado e não estivermos no meio de um download, envia pra nuvem
  if (usuarioAtual && !baixandoDados) {
    try {
      await setDoc(doc(db, "usuarios", usuarioAtual.uid, "backup", "meus_gastos"), {
        [chave]: valor,
        ultima_sincronizacao: new Date().toISOString()
      }, { merge: true });
      console.log(`Dado '${chave}' enviado para a nuvem.`);
    } catch (erro) {
      console.error("Erro ao sincronizar com Firebase:", erro);
    }
  }
};
