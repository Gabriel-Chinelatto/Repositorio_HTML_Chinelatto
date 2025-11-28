/* --- Adicione isto ao seu /js/main.js --- */

/**
 * Deve ser chamado logo após inserir o fragmento HTML dentro do #content-container.
 * Exemplo do roteador SPA: fetch('/pages/cadastro-ong.html').then(r=>r.text()).then(html=>{
 *   document.querySelector('#content-container').innerHTML = html;
 *   initPageScripts(); // <-- chama isso
 * });
 */
function initPageScripts() {
  // Cadastro ONG
  const form = document.getElementById('cadastro-ong-form');
  if (form) {
    setupCadastroOngForm(form);
  }

  // Se estivermos na lista de ONGs, podemos ter espaço para exibir alertas adicionados.
  const ongsList = document.getElementById('ongs-list');
  if (ongsList) {
    // Nenhuma ação obrigatória, mas pode-se adicionar listeners para filtros, etc.
  }
}

/* ---------- Funções de validação e UI ---------- */

function showAlert(containerId, type, message, timeout = 6000) {
  // type: 'success' | 'danger' | 'warning' | 'info'
  const placeholder = document.getElementById(containerId);
  if (!placeholder) return;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    </div>
  `;
  placeholder.appendChild(wrapper);
  if (timeout > 0) {
    setTimeout(() => {
      try { wrapper.querySelector('.btn-close').click(); } catch(e){}
    }, timeout);
  }
}

/* Validações customizadas do formulário */
function setupCadastroOngForm(form) {
  const btnReset = document.getElementById('btn-reset');
  const prioridadeValue = document.getElementById('prioridade-value');
  const prioridadeInput = document.getElementById('prioridade');

  if (prioridadeInput && prioridadeValue) {
    prioridadeInput.addEventListener('input', () => {
      prioridadeValue.textContent = prioridadeInput.value;
    });
  }

  // Limpar mensagens custom ao resetar
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      hideElementById('servicos-feedback');
      hideElementById('tipo-feedback');
      hideElementById('logo-feedback');
      // Limpar classes de validação
      form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    // Limpar mensagens anteriores
    hideElementById('servicos-feedback');
    hideElementById('tipo-feedback');
    hideElementById('logo-feedback');
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    let valid = true;

    // 1) HTML5 validity checks gerais
    if (!form.checkValidity()) {
      // Marcar campos inválidos
      Array.from(form.elements).forEach(el => {
        if (el.willValidate && !el.checkValidity()) {
          el.classList.add('is-invalid');
        }
      });
      valid = false;
    }

    // 2) Checar ao menos 1 serviço (checkbox) marcado
    const servicos = Array.from(form.querySelectorAll('.servico-checkbox'));
    const anyServico = servicos.some(ch => ch.checked);
    if (!anyServico) {
      document.getElementById('servicos-feedback').style.display = 'block';
      valid = false;
    }

    // 3) Checar tipo (radio)
    const tipoChecked = form.querySelector('input[name="tipo"]:checked');
    if (!tipoChecked) {
      document.getElementById('tipo-feedback').style.display = 'block';
      valid = false;
    }

    // 4) Validação do arquivo logo (se enviado): tipo e tamanho <= 2MB
    const logoInput = document.getElementById('logo');
    if (logoInput && logoInput.files && logoInput.files.length > 0) {
      const file = logoInput.files[0];
      const allowed = ['image/png', 'image/jpeg'];
      if (!allowed.includes(file.type)) {
        const fb = document.getElementById('logo-feedback');
        fb.style.display = 'block';
        fb.textContent = 'Formato inválido. Use PNG ou JPG.';
        valid = false;
      } else if (file.size > 2 * 1024 * 1024) {
        const fb = document.getElementById('logo-feedback');
        fb.style.display = 'block';
        fb.textContent = 'Arquivo muito grande. Máx 2MB.';
        valid = false;
      }
    }

    // 5) Checar ano dentro do intervalo programático (ex.: min-max)
    const anoInput = document.getElementById('ano');
    if (anoInput) {
      const ano = parseInt(anoInput.value, 10);
      if (isNaN(ano) || ano < 1900 || ano > 2025) {
        anoInput.classList.add('is-invalid');
        valid = false;
      }
    }

    if (!valid) {
      showAlert('cad-alert-placeholder', 'danger', 'Por favor corrija os erros no formulário antes de enviar.', 5000);
      return;
    }

    // Se tudo ok — processar dados (aqui vamos adicionar à lista em /pages/ongs.html via DOM)
    const formData = new FormData(form);
    const newOng = {
      nome: formData.get('nome'),
      email: formData.get('email'),
      telefone: formData.get('telefone'),
      site: formData.get('site'),
      ano: formData.get('ano'),
      estado: formData.get('estado'),
      descricao: formData.get('descricao'),
      servicos: servicos.filter(ch => ch.checked).map(ch => ch.value),
      tipo: formData.get('tipo'),
      cor: formData.get('cor'),
      prioridade: formData.get('prioridade')
      // logo não salva no servidor — apenas usamos preview se quiser
    };

    // Adiciona à lista de ONGs, se estiver na página de listagem
    appendOngToList(newOng);

    // Mensagem de sucesso
    showAlert('cad-alert-placeholder', 'success', 'ONG cadastrada com sucesso!', 5000);
    showAlert('ongs-alert-placeholder', 'info', `A ONG "${newOng.nome}" foi adicionada à listagem localmente.`, 5000);

    // Resetar o formulário
    form.reset();
    if (prioridadeValue) prioridadeValue.textContent = '5';
  });
}

/* util */
function hideElementById(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

/* Função que anexa visualmente a ONG ao container #ongs-list se existir */
function appendOngToList(ong) {
  const container = document.getElementById('ongs-list');
  if (!container) return;

  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';
  col.innerHTML = `
    <div class="card h-100" style="border-top: 4px solid ${escapeHtml(ong.cor || '#6c757d')}">
      <div class="card-body">
        <h5 class="card-title">${escapeHtml(ong.nome)}</h5>
        <p class="card-text">${escapeHtml(ong.descricao)}</p>
      </div>
      <div class="card-footer">
        <small class="text-muted">
          ${escapeHtml(ong.email || '')} ${ong.telefone ? ' | ' + escapeHtml(ong.telefone) : ''}
        </small>
      </div>
    </div>
  `;
  // Inserir no topo
  container.prepend(col);
}

/* prevenção básica XSS na hora de inserir texto */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* Exportar função global se for necessário chamá-la de outro arquivo */
window.initPageScripts = initPageScripts;
