// ===================================================================================
// ARQUITETURA SINGLE PAGE APPLICATION (SPA) - main.js
// Contém o roteamento, a lógica de validação de formulários e a manipulação de dados
// ===================================================================================

(function() {
    // ======================== CONSTANTES & UTILS ========================
    const CONTENT_CONTAINER_ID = 'content-container';
    const FRAGMENT_PATH = 'pages/';
    const JSON_PATH = 'data/';
    
    // Chaves para localStorage (Simulação de persistência de dados)
    const ONGS_KEY = 'connect_ong_ongs';
    const CONTATO_KEY = 'connect_ong_contatos';
    const DOACOES_KEY = 'connect_ong_doacoes';
    const EMPRESAS_KEY = 'connect_ong_empresas';
    const META_ARRECADACAO = 2000;
    
    /** Função utilitária para ler array do localStorage. */
    function readArray(key) {
        const json = localStorage.getItem(key);
        return json ? JSON.parse(json) : [];
    }
    
    /** Função utilitária para escrever array no localStorage. */
    function writeArray(key, array) {
        localStorage.setItem(key, JSON.stringify(array));
    }

    /** Função utilitária de prevenção básica XSS na hora de inserir texto */
    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    /** Função utilitária para esconder um elemento (usado em validações) */
    function hideElementById(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    }

    // ======================== ROTEAMENTO SPA (Single Page Application) ========================

    /** * Carrega o conteúdo de um fragmento HTML e o injeta no container principal.
     * Requisito: Usa fetch() para buscar o conteúdo e .innerHTML para injetar[cite: 1163, 1164].
     * @param {string} fragmentName Nome do arquivo HTML (ex: 'home', 'contato').
     */
    async function loadFragment(fragmentName) {
        const container = document.getElementById(CONTENT_CONTAINER_ID);
        if (!container) return;

        // Padrão de fragmento é 'home' ou o nome da rota (ex: 'contato')
        const path = FRAGMENT_PATH + (fragmentName === '/' ? 'home' : fragmentName) + '.html';
        
        try {
            const response = await fetch(path);
            if (!response.ok) {
                container.innerHTML = `<div class="container py-5 text-center">
                    <h1>Erro 404</h1>
                    <p class="lead">Página não encontrada: ${path}</p>
                </div>`;
                return;
            }
            
            const html = await response.text();
            container.innerHTML = html;
            
            // Inicializa scripts específicos da página carregada
            initPageScripts(fragmentName);

        } catch (error) {
            console.error('Error loading fragment:', error);
            container.innerHTML = `<div class="container py-5 text-center">
                <h1>Erro de Carregamento</h1>
                <p class="lead">Não foi possível carregar o conteúdo da página.</p>
            </div>`;
        }
    }

    /** Trata a mudança de hash para carregar o fragmento correto. */
    function handleRoute() {
        let hash = window.location.hash.slice(1);
        if (hash.startsWith('/')) hash = hash.slice(1); 
        
        const fragment = hash || '/';
        loadFragment(fragment);
    }

    /** * Inicializa o roteamento.
     * Requisito: Adiciona event listeners aos links e impede o comportamento padrão[cite: 1161, 1162].
     */
    function initRotas() {
        window.addEventListener('hashchange', handleRoute);

        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href').startsWith('#/')) {
                e.preventDefault(); 
                window.location.hash = link.getAttribute('href').slice(1);
            }
        });

        // Carrega o fragmento inicial
        handleRoute();
    }
    
    // ======================== FUNÇÕES DE INICIALIZAÇÃO DE PÁGINAS ========================

    /** Executa o script específico para a página recém-carregada. */
    function initPageScripts(fragmentName) {
        switch (fragmentName) {
            case 'contato':
                initContatoPage();
                break;
            case 'cadastro-ong':
                initCadastroOngPage();
                break;
            case 'doacoes':
                initDoacoesPage();
                break;
            case 'empresas':
                initEmpresasPage();
                break;
            case 'ongs':
                initOngsPage();
                break;
            case 'agradecimento':
                initAgradecimentoPage();
                break;
        }
    }

    // ======================== LÓGICA DE PÁGINAS (Validação e Dados) ========================

    // ---------------- Lógica para Contato ----------------
    function initContatoPage() {
        const form = document.getElementById('contato-form');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            
            // Validação customizada (Requisito 5)
            const feedbackEl = document.getElementById('form-feedback');
            const preferencia = form.preferencia.value;
            const telefone = form.telefone.value.trim();
            
            let valid = true;
            if (!form.checkValidity()) {
                valid = false;
            } else {
                // Validação 1: Telefone obrigatório se a preferência for telefone
                if (preferencia === 'telefone' && telefone.length < 8) {
                    feedbackEl.innerHTML = '<div class="alert alert-danger">Você escolheu contato por telefone — informe um número válido.</div>';
                    form.telefone.classList.add('is-invalid');
                    form.telefone.focus();
                    valid = false;
                }
            }

            if (valid) {
                // Montar objeto contato e salvar (Simulação)
                const contato = {
                    id: Math.random().toString(36).slice(2,9),
                    nome: form.nome.value.trim(),
                    email: form.email.value.trim(),
                    telefone,
                    idade: form.idade.value || null,
                    site: form.site.value || null,
                    data: form.data.value || null,
                    horario: form.horario.value || null,
                    assunto: form.assunto.value || null,
                    preferencia,
                    interesses: Array.from(form.querySelectorAll('input[name="interesses"]:checked')).map(c => c.value),
                    cor: form['cor-favorita'] ? form['cor-favorita'].value : null,
                    nivel: form.nivel ? form.nivel.value : null,
                    mensagem: form.mensagem.value.trim(),
                    anexado: form.anexo.files.length ? form.anexo.files[0].name : null,
                    createdAt: new Date().toISOString()
                };

                const contatos = readArray(CONTATO_KEY);
                contatos.unshift(contato);
                writeArray(CONTATO_KEY, contatos);
                localStorage.setItem('connect_ong_last_contact', JSON.stringify(contato));
                
                feedbackEl.innerHTML = '<div class="alert alert-success">Mensagem enviada com sucesso (simulação). Redirecionando...</div>';
                form.reset();
                form.classList.remove('was-validated');
                
                setTimeout(() => {
                    window.location.hash = '#/agradecimento';
                }, 800);
            } else {
                 form.classList.add('was-validated');
            }
        });
    }

    // ---------------- Lógica para Cadastro de ONG ----------------
    function initCadastroOngPage() {
        const form = document.getElementById('cadastro-ong-form');
        if (!form) return;

        const prioridadeInput = document.getElementById('prioridade');
        const prioridadeValue = document.getElementById('prioridade-value');
        if (prioridadeInput && prioridadeValue) {
            prioridadeInput.addEventListener('input', () => {
                prioridadeValue.textContent = prioridadeInput.value;
            });
        }

        const btnReset = document.getElementById('btn-reset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                hideElementById('servicos-feedback');
                hideElementById('tipo-feedback');
                hideElementById('logo-feedback');
                form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
                if (prioridadeValue) prioridadeValue.textContent = '5';
            });
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            hideElementById('servicos-feedback');
            hideElementById('tipo-feedback');
            hideElementById('logo-feedback');
            form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

            let valid = true;

            if (!form.checkValidity()) valid = false;

            // Validação customizada (a) Checar ao menos 1 serviço (checkbox)
            const servicos = Array.from(form.querySelectorAll('.servico-checkbox'));
            const anyServico = servicos.some(ch => ch.checked);
            if (!anyServico) {
                document.getElementById('servicos-feedback').style.display = 'block';
                valid = false;
            }

            // Validação customizada (b) Checar tipo (radio)
            const tipoChecked = form.querySelector('input[name="tipo"]:checked');
            if (!tipoChecked) {
                document.getElementById('tipo-feedback').style.display = 'block';
                valid = false;
            }

            // Validação customizada (c) Validação do arquivo logo (tipo e tamanho <= 2MB)
            const logoInput = document.getElementById('logo');
            if (logoInput && logoInput.files && logoInput.files.length > 0) {
                const file = logoInput.files[0];
                const allowed = ['image/png', 'image/jpeg'];
                const fb = document.getElementById('logo-feedback');

                if (!allowed.includes(file.type)) {
                    fb.style.display = 'block';
                    fb.textContent = 'Formato inválido. Use PNG ou JPG.';
                    logoInput.classList.add('is-invalid');
                    valid = false;
                } else if (file.size > 2 * 1024 * 1024) {
                    fb.style.display = 'block';
                    fb.textContent = 'Arquivo muito grande. Máx. 2MB.';
                    logoInput.classList.add('is-invalid');
                    valid = false;
                }
            }

            if (valid) {
                // Se tudo válido, salva o objeto e redireciona
                const ong = {
                    id: Math.random().toString(36).slice(2,9),
                    nome: form.nome.value.trim(),
                    email: form.email.value.trim(),
                    telefone: form.telefone.value.trim(),
                    site: form.site.value || null,
                    ano: form.ano.value,
                    estado: form.estado.value,
                    descricao: form.descricao.value.trim(),
                    servicos: Array.from(form.querySelectorAll('.servico-checkbox:checked')).map(c => c.value),
                    tipo: form.tipo.value,
                    cor: form.cor.value || '#6c757d',
                    prioridade: form.prioridade.value,
                    logoName: logoInput && logoInput.files.length > 0 ? logoInput.files[0].name : null,
                    createdAt: new Date().toISOString()
                };

                const ongs = readArray(ONGS_KEY);
                ongs.unshift(ong);
                writeArray(ONGS_KEY, ongs);

                // Feedback visual
                const alertContainer = document.getElementById('cad-alert-placeholder');
                if (alertContainer) {
                    alertContainer.innerHTML = '<div class="alert alert-success">ONG cadastrada com sucesso! Redirecionando...</div>';
                }

                form.reset();
                form.classList.remove('was-validated');
                if (prioridadeValue) prioridadeValue.textContent = '5';
                
                setTimeout(() => {
                    window.location.hash = '#/ongs'; // Redireciona para a lista
                }, 800);
            } else {
                form.classList.add('was-validated');
            }
        });
    }

    // ---------------- Lógica para Doações ----------------
    function initDoacoesPage() {
        const btns = document.querySelectorAll('.btn-doar');
        if (btns.length === 0) return;

        const doacoes = readArray(DOACOES_KEY);
        updateEstatisticas(doacoes);
        renderDoacoesList(doacoes);

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = Number(btn.dataset.amount);
                const type = btn.dataset.type;
                handleDoacao(amount, type);
            });
        });
    }
    
    function handleDoacao(amount, type) {
        const now = new Date().toISOString();
        const doacoes = readArray(DOACOES_KEY);
        
        const newDoacao = { amount, type, date: now, id: Math.random().toString(36).slice(2, 9) };
        
        doacoes.unshift(newDoacao);
        writeArray(DOACOES_KEY, doacoes);
        
        updateEstatisticas(doacoes);
        renderDoacoesList(doacoes);

        localStorage.setItem('connect_ong_last_doacao', JSON.stringify(newDoacao));

        // Feedback visual
        const btns = document.querySelectorAll('.btn-doar');
        btns.forEach(b => b.disabled = true);
        
        const info = document.createElement('div');
        info.className = 'mt-3 alert alert-success';
        info.textContent = `Doação de R$ ${amount.toFixed(2).replace('.', ',')} registrada (simulação). Obrigado!`;
        const container = document.querySelector('#doacoes-page'); 
        if (container) container.prepend(info);
        
        setTimeout(() => { 
            info.remove();
            btns.forEach(b => b.disabled = false);
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

        if (elTotal) elTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        if (elCount) elCount.textContent = count;
        if (elAvg) elAvg.textContent = `R$ ${avg.toFixed(2).replace('.', ',')}`;
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

        doacoes.slice(0, 5).forEach(d => {
            const item = document.createElement('li');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            const date = new Date(d.date).toLocaleDateString('pt-BR', { dateStyle: 'short' });
            const time = new Date(d.date).toLocaleTimeString('pt-BR', { timeStyle: 'short' });

            item.innerHTML = `
                <span>
                    <strong>${d.type}</strong> - R$ ${Number(d.amount).toFixed(2).replace('.', ',')}
                </span>
                <span class="text-muted small">${date} ${time}</span>
            `;
            list.appendChild(item);
        });
    }
    
    // ---------------- Lógica para Agradecimento ----------------
    function initAgradecimentoPage() {
        const lastContact = JSON.parse(localStorage.getItem('connect_ong_last_contact'));
        const lastDoacao = JSON.parse(localStorage.getItem('connect_ong_last_doacao'));
        
        const textEl = document.getElementById('agradecimento-text');
        const detailsEl = document.getElementById('agradecimento-detalhes');

        if (textEl && detailsEl) {
            if (lastDoacao) {
                textEl.textContent = `Obrigado pela sua doação de ${lastDoacao.type}!`;
                detailsEl.innerHTML = `Registramos um apoio de <strong>R$ ${Number(lastDoacao.amount).toFixed(2).replace('.', ',')}</strong>.<br>Sua generosidade faz a diferença.`;
                localStorage.removeItem('connect_ong_last_doacao'); 
            } else if (lastContact) {
                textEl.textContent = `Obrigado, ${escapeHtml(lastContact.nome)}!`;
                detailsEl.innerHTML = `Recebemos sua mensagem sobre <strong>${escapeHtml(lastContact.assunto || 'assunto não especificado')}</strong>.<br>Entraremos em contato via ${lastContact.preferencia} em breve.`;
                localStorage.removeItem('connect_ong_last_contact'); 
            } else {
                textEl.textContent = 'Obrigado por sua visita!';
                detailsEl.textContent = 'Não identificamos um contato ou doação recente.';
            }
        }
    }
    
    // ---------------- Lógica para Empresas e ONGs (JSON Dinâmico) ----------------
    
    /** * Carrega dados de um arquivo JSON local e renderiza no elemento especificado.
     * Requisito: Duas seções devem carregar dados de arquivos .json locais.
     */
    async function loadAndRenderJson(fragmentName, dataFileName, listId, renderFunction) {
        const container = document.getElementById(listId);
        if (!container) return;

        const dataPath = JSON_PATH + dataFileName;
        
        const localStorageKey = fragmentName === 'ongs' ? ONGS_KEY : EMPRESAS_KEY;
        let data = readArray(localStorageKey);
        
        // Se a lista de ONGs em memória (do localStorage) tiver novos itens, use-os.
        if (fragmentName === 'ongs' && data.length > 0) {
            container.innerHTML = '';
            data.forEach(item => renderFunction(container, item));
            return;
        }

        // Carregar do JSON (simulação de dados iniciais)
        try {
            const response = await fetch(dataPath);
            if (!response.ok) {
                container.innerHTML = '<p class="text-danger">Erro ao carregar os dados. Arquivo JSON não encontrado.</p>';
                return;
            }
            data = await response.json();
        } catch (error) {
            container.innerHTML = '<p class="text-danger">Erro ao processar o arquivo JSON.</p>';
            return;
        }

        // Renderizar e Salvar no localStorage (Simulação de primeiro carregamento)
        container.innerHTML = '';
        data.forEach(item => renderFunction(container, item));

        if (fragmentName === 'empresas') {
             writeArray(EMPRESAS_KEY, data);
        } else if (fragmentName === 'ongs') {
             // Se for ONGs, os dados do JSON são os dados iniciais. Salva para iniciar o localStorage.
             writeArray(ONGS_KEY, data);
        }
    }

    // Função de renderização específica para ONGs
    function renderOngItem(container, ong) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        col.innerHTML = `
            <div class="card h-100 card-list-item" style="border-color: ${escapeHtml(ong.cor || '#6c757d')}">
                <div class="card-body">
                    <h5 class="card-title">${escapeHtml(ong.nome)}</h5>
                    <p class="card-text">${escapeHtml(ong.descricao)}</p>
                </div>
                <div class="card-footer bg-white border-0 pt-0">
                    <small class="text-muted">
                        📩 ${escapeHtml(ong.email || '')} ${ong.telefone ? ' | 📞 ' + escapeHtml(ong.telefone) : ''}
                    </small>
                </div>
            </div>
        `;
        container.appendChild(col);
    }
    
    // Função de renderização específica para Empresas
    function renderEmpresaItem(container, empresa) {
        const col = document.createElement('div');
        col.className = 'col-md-6'; 
        
        col.innerHTML = `
            <div class="card h-100 card-list-item" style="border-color: var(--cor-primaria)">
                <div class="card-body">
                    <h5 class="card-title">${escapeHtml(empresa.nome)} <span class="badge bg-success">Parceira</span></h5>
                    <p class="card-text">
                        Área: ${escapeHtml(empresa.area)} - Cidade: ${escapeHtml(empresa.cidade)}.<br>
                        Tipo de Doação: <span class="badge bg-secondary">${escapeHtml(empresa.tipo_doacao)}</span>
                    </p>
                </div>
            </div>
        `;
        container.appendChild(col);
    }

    function initOngsPage() {
        // Carrega dados iniciais do JSON ou o cache com novos cadastros
        loadAndRenderJson('ongs', 'ongs.json', 'ongs-list', renderOngItem);
    }
    
    function initEmpresasPage() {
        // Carrega dados do JSON
        loadAndRenderJson('empresas', 'empresas.json', 'empresas-list', renderEmpresaItem);
    }

    // ======================== START UP ========================
    window.addEventListener('load', initRotas);
})();