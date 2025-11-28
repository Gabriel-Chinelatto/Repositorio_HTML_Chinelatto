// js/gabriel.js
// Chamadas públicas: initGabrielPage()
(function () {
  const DOACOES_KEY = 'connect_ong_doacoes';
  const CONTATO_KEY = 'connect_ong_contatos';
  const META_ARRECADACAO = 2000;

  // util: pega array do localStorage
  function readArray(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      return [];
    }
  }
  function writeArray(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
  }

  // Inicializa a página de doações
  function initDoacoes() {
    const doacoes = readArray(DOACOES_KEY);
    updateEstatisticas(doacoes);
    renderDoacoesList(doacoes);

    // Delegation para botões de doação
    document.querySelectorAll('.btn-doar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const amount = Number(btn.dataset.amount) || 0;
        const type = btn.dataset.type || 'Outros';
        handleDoacao(amount, type);
      });
    });
  }

  function handleDoacao(amount, type) {
    const now = new Date().toISOString();
    const doacoes = readArray(DOACOES_KEY);
    const newDoacao = {
      amount,
      type,
      date: now,
      id: Math.random().toString(36).slice(2, 9)
    };
    doacoes.unshift(newDoacao);
    writeArray(DOACOES_KEY, doacoes);
    updateEstatisticas(doacoes);
    renderDoacoesList(doacoes);

    // guardar última doação para agradecimento
    localStorage.setItem('connect_ong_last_doacao', JSON.stringify(newDoacao));

    // pequena confirmação visual (não alert)
    const btns = document.querySelectorAll('.btn-doar');
    btns.forEach(b => b.disabled = true);
    const info = document.createElement('div');
    info.className = 'mt-3 alert alert-success';
    info.textContent = `Doação de R$ ${amount.toFixed(2)} registrada (simulação). Obrigado!`;
    const container = document.querySelector('#doacoes-page .container') || document.querySelector('#doacoes-page');
    if (container) container.prepend(info);
    setTimeout(() => {
      info.remove();
      btns.forEach(b => b.disabled = false);
      // opcional: direcionar para a página de agradecimento
      window.location.hash = '#/agradecimento';
    }, 900);
  }

  function updateEstatisticas(doacoes) {
    const total = doacoes.reduce((s, d) => s + Number(d.amount || 0), 0);
    const count = doacoes.length;
    const avg = count ? (total / count) : 0;
    const prog = Math.min(100, Math.round((total / META_ARRECADACAO) * 100));

    const elTotal = document.getElementById('estat-total');
    const elCount = document.getElementById('estat-count');
    const elAvg = document.getElementById('estat-average');
    const elProg = document.getElementById('estat-progress');

    if (elTotal) elTotal.textContent = `R$ ${total.toFixed(2)}`;
    if (elCount) elCount.textContent = count;
    if (elAvg) elAvg.textContent = `R$ ${avg.toFixed(2)}`;
    if (elProg) {
      elProg.style.width = prog + '%';
      elProg.setAttribute('aria-valuenow', prog);
    }
  }

  function renderDoacoesList(doacoes) {
    const list = document.getElementById('lista-doacoes');
    if (!list) return;
    list.innerHTML = '';
    if (doacoes.length === 0) {
      list.innerHTML = '<li class="list-group-item text-muted">Nenhuma doação ainda.</li>';
      return;
    }
    doacoes.slice(0, 10).forEach(d => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-start';
      const left = document.createElement('div');
      left.innerHTML = `<div class="fw-bold">R$ ${Number(d.amount).toFixed(2)} — ${d.type}</div><small class="text-muted">${new Date(d.date).toLocaleString()}</small>`;
      const right = document.createElement('div');
      right.innerHTML = `<button class="btn btn-sm btn-outline-danger btn-remove" data-id="${d.id}">Remover</button>`;
      li.append(left, right);
      list.appendChild(li);
    });

    // Attach remove handlers
    list.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const arr = readArray(DOACOES_KEY).filter(x => x.id !== id);
        writeArray(DOACOES_KEY, arr);
        updateEstatisticas(arr);
        renderDoacoesList(arr);
      });
    });
  }

  // --- Contato: validação e simulação de envio ---
  function initContato() {
    const form = document.getElementById('contato-form');
    if (!form) return;

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();

      // Limpar feedback
      const feedbackEl = document.getElementById('form-feedback');
      feedbackEl.innerHTML = '';

      // Bootstrap built-in validation
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        feedbackEl.innerHTML = '<div class="alert alert-danger">Corrija os campos destacados antes de enviar.</div>';
        return;
      }

      // Regras custom (exemplo): nome mínimo, mensagem mínimo, telefone se marcado preferência telefone
      const nome = form.nome.value.trim();
      const mensagem = form.mensagem.value.trim();
      const preferencia = form.preferencia.value;
      const telefone = form.telefone.value.trim();

      if (nome.length < 3) {
        feedbackEl.innerHTML = '<div class="alert alert-danger">Nome muito curto.</div>';
        form.nome.focus();
        return;
      }
      if (mensagem.length < 10) {
        feedbackEl.innerHTML = '<div class="alert alert-danger">A mensagem deve conter pelo menos 10 caracteres.</div>';
        form.mensagem.focus();
        return;
      }
      if (preferencia === 'telefone' && telefone.length < 8) {
        feedbackEl.innerHTML = '<div class="alert alert-danger">Você escolheu contato por telefone — informe um número válido.</div>';
        form.telefone.focus();
        return;
      }

      // Montar objeto contato (não enviar a servidor — simulação)
      const contato = {
        id: Math.random().toString(36).slice(2,9),
        nome,
        email: form.email.value.trim(),
        telefone,
        idade: form.idade.value || null,
        site: form.site.value || null,
        data: form.data.value || null,
        horario: form.horario.value || null,
        assunto: form.assunto.value || null,
        preferencia,
        interesses: Array.from(form.querySelectorAll('input[name="interesses"]:checked')).map(c => c.value),
        cor: form.cor ? form.cor.value : null,
        nivel: form.nivel ? form.nivel.value : null,
        mensagem,
        anexado: form.anexo.files.length ? form.anexo.files[0].name : null,
        createdAt: new Date().toISOString()
      };

      // Salvar no localStorage
      const contatos = readArray(CONTATO_KEY);
      contatos.unshift(contato);
      writeArray(CONTATO_KEY, contatos);
      localStorage.setItem('connect_ong_last_contact', JSON.stringify(contato));

      // Mostrar feedback visual e redirecionar para agradecimento
      feedbackEl.innerHTML = '<div class="alert alert-success">Mensagem enviada com sucesso (simulação). Redirecionando...</div>';
      form.reset();
      form.classList.remove('was-validated');

      // redireciona para agradecimento após curtíssimo delay (simulação de envio)
      setTimeout(() => {
        window.location.hash = '#/agradecimento';
      }, 800);
    });

    // Optional: live validation for telefone pattern
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
      telefoneInput.addEventListener('input', () => {
        const pattern = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
        if (telefoneInput.value.trim() === '') {
          telefoneInput.classList.remove('is-invalid');
          telefoneInput.classList.remove('is-valid');
          return;
        }
        if (pattern.test(telefoneInput.value.trim())) {
          telefoneInput.classList.remove('is-invalid');
          telefoneInput.classList.add('is-valid');
        } else {
          telefoneInput.classList.add('is-invalid');
          telefoneInput.classList.remove('is-valid');
        }
      });
    }
  }

  // Página de agradecimento: mostra dados do último envio (contato ou doação)
  function initAgradecimento() {
    const lastContact = JSON.parse(localStorage.getItem('connect_ong_last_contact') || 'null');
    const lastDoacao = JSON.parse(localStorage.getItem('connect_ong_last_doacao') || 'null');

    const textEl = document.getElementById('agradecimento-text');
    const detailsEl = document.getElementById('agradecimento-detalhes');

    if (!textEl || !detailsEl) return;

    if (lastContact) {
      textEl.textContent = `Obrigado, ${lastContact.nome}! Recebemos sua mensagem.`;
      detailsEl.textContent = `Assunto: ${lastContact.assunto || '—'} • Enviado em ${new Date(lastContact.createdAt).toLocaleString()}`;
      return;
    }

    if (lastDoacao) {
      textEl.textContent = `Muito obrigado pela doação de R$ ${Number(lastDoacao.amount).toFixed(2)}!`;
      detailsEl.textContent = `Tipo: ${lastDoacao.type} • Data: ${new Date(lastDoacao.date).toLocaleString()}`;
      return;
    }

    textEl.textContent = `Obrigado!`;
    detailsEl.textContent = `Sua interação foi registrada.`;
  }

  // função pública de inicialização (chamada após o fragmento ser injetado)
  function initGabrielPage() {
    // detecta qual fragmento está presente e inicia o comportamento adequado
    if (document.getElementById('doacoes-page')) initDoacoes();
    if (document.getElementById('contato-page')) initContato();
    if (document.getElementById('agradecimento-page')) initAgradecimento();
  }

  // exporta globalmente
  window.initGabrielPage = initGabrielPage;
})();

