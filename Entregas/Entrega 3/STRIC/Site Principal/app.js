// ======= Persistência =======
const STORAGE_KEYS = {
  INVENTARIO: 'estoqueMecanica',
  THEME: 'stric_theme',
  ACCENT: 'stric_accent'
};

// ======= Estado =======
let estoque = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTARIO)) || [
  { id: 1, codigo: 'OL-200', nome: 'Óleo 5W30 Sintético', categoria: 'oleos', qtd: 30, minimo: 15, custo: 35.00, venda: 55.00, fornecedor: 'Lubri Total' },
  { id: 2, codigo: 'PM-050', nome: 'Pastilha Freio Diant.',  categoria: 'freios',  qtd: 15, minimo: 10, custo: 80.00, venda: 149.90, fornecedor: 'Freios Cia' },
  { id: 3, codigo: 'CX-99', nome: 'Correia Dentada (Kit)',   categoria: 'motor',   qtd: 1,  minimo: 5,  custo: 120.00, venda: 250.00, fornecedor: 'Peças Motor Sul' },
  { id: 4, codigo: 'BL-110', nome: 'Bateria 60ah',            categoria: 'eletrica',qtd: 8,  minimo: 6,  custo: 280.00, venda: 450.00, fornecedor: 'Baterias Top' },
  { id: 5, codigo: 'PL-10', nome: 'Pneu Aro 14 (Modelo X)',   categoria: 'freios',  qtd: 2,  minimo: 10, custo: 180.00, venda: 350.00, fornecedor: 'Distribuidora Pneus' }
];
let proximoId = estoque.length > 0 ? Math.max(...estoque.map(i => i.id)) + 1 : 1;

// ======= Utils =======
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const salvarEstoque = () => localStorage.setItem(STORAGE_KEYS.INVENTARIO, JSON.stringify(estoque));
const money = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const marginPct = (c,v) => (c === 0 || v === 0) ? '0%' : (((v - c) / c) * 100).toFixed(0) + '%';

// ======= Tema / Config =======
function aplicarTemaInicial(){
  const salvo = localStorage.getItem(STORAGE_KEYS.THEME);
  const tema = salvo || 'dark';
  document.documentElement.setAttribute('data-theme', tema);
  const sw = $('#switchTema');
  if (sw) sw.checked = (tema === 'dark');
  atualizarIconeTemaBtn();
}
function alternarTema(){
  const atual = document.documentElement.getAttribute('data-theme') || 'dark';
  const prox = (atual === 'dark') ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', prox);
  localStorage.setItem(STORAGE_KEYS.THEME, prox);
  atualizarIconeTemaBtn();
}
function atualizarIconeTemaBtn(){
  const tema = document.documentElement.getAttribute('data-theme') || 'dark';
  const btn = $('#btnThemeToggle');
  if (!btn) return;
  btn.innerHTML = tema === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}
function aplicarAcento(corHex){
  document.documentElement.style.setProperty('--cor-principal', corHex);
  localStorage.setItem(STORAGE_KEYS.ACCENT, corHex);
}
function aplicarAcentoInicial(){
  const salvo = localStorage.getItem(STORAGE_KEYS.ACCENT);
  if (salvo) aplicarAcento(salvo);
}

// ======= Render =======
function carregarTabelas(filtroBusca = '', filtroCategoria = ''){
  let htmlEstoque = '';
  let htmlCriticos = '';
  let totalCriticos = 0;
  let totalValor = 0;
  let htmlTop5 = '';
  let countTop5 = 0;

  const termo = filtroBusca.trim().toLowerCase();
  const filtrados = estoque.filter(item => {
    const categoriaOk = !filtroCategoria || item.categoria === filtroCategoria;
    const buscaOk = !termo || item.nome.toLowerCase().includes(termo) ||
                    item.codigo.toLowerCase().includes(termo) ||
                    (item.fornecedor||'').toLowerCase().includes(termo);
    return categoriaOk && buscaOk;
  });

  filtrados.forEach(item => {
    const critico = item.qtd < item.minimo;
    totalValor += item.qtd * item.venda;

    htmlEstoque += `
      <tr class="${critico ? 'table-warning' : ''}">
        <td>${item.codigo}</td>
        <td>${item.nome}</td>
        <td>${item.categoria.toUpperCase()}</td>
        <td class="text-end">${item.qtd}</td>
        <td class="text-end">${money(item.custo)}</td>
        <td class="text-end text-success fw-bold">${money(item.venda)}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-info text-white" data-id="${item.id}" data-action="ver">Ver</button>
        </td>
      </tr>
    `;

    if (critico){
      totalCriticos++;
      const pedir = item.minimo - item.qtd;

      htmlCriticos += `
        <tr class="linha-critica">
          <td>${item.codigo}</td>
          <td>${item.nome}</td>
          <td>${item.fornecedor || '—'}</td>
          <td class="text-end">${item.qtd}</td>
          <td class="text-end">${item.minimo}</td>
          <td class="text-end text-danger fw-bold">${pedir}</td>
          <td class="text-center">
            <button class="btn btn-sm btn-primary" data-id="${item.id}" data-action="pedido">Gerar Pedido</button>
          </td>
        </tr>
      `;

      if (countTop5 < 5){
        htmlTop5 += `
          <tr class="linha-critica">
            <td>${item.codigo}</td>
            <td>${item.nome}</td>
            <td>${item.qtd}</td>
            <td>${item.minimo}</td>
            <td><span class="badge bg-danger">Urgente</span></td>
          </tr>
        `;
        countTop5++;
      }
    }
  });

  // Totais e renders
  $('#tabelaEstoqueCompleto').innerHTML = htmlEstoque;
  $('#tabelaCriticosCompleta').innerHTML = htmlCriticos;
  $('#tabelaCriticosDashboard').innerHTML = htmlTop5;
  $('#totalItensCriticos').innerText = totalCriticos;
  $('#totalValorEstoque').innerText = money(totalValor);

  // Indicador Relatórios (margem média simples)
  const margens = estoque.map(i => {
    if (i.custo <= 0) return 0;
    return ((i.venda - i.custo) / i.custo) * 100;
  });
  const media = margens.length ? (margens.reduce((a,b)=>a+b,0) / margens.length) : 0;
  const elMargem = $('#margemMedia');
  if (elMargem) elMargem.textContent = `${Math.round(media)}%`;
}

// ======= Ações =======
function adicionarNovoItem(){
  const nome = $('#itemNome').value.trim();
  const codigo = $('#itemCodigo').value.trim();
  const categoria = $('#itemCategoria').value;
  const qtd = parseInt($('#itemQtd').value,10);
  const minimo = parseInt($('#itemMinimo').value,10);
  const custo = parseFloat($('#itemCusto').value);
  const venda = parseFloat($('#itemVenda').value);
  const fornecedor = $('#itemFornecedor').value.trim();

  if (!nome || !codigo || !categoria || isNaN(qtd) || isNaN(minimo) || isNaN(custo) || isNaN(venda)){
    alert('Preencha os campos obrigatórios e números válidos.');
    return;
  }

  const novo = { id: proximoId++, codigo, nome, categoria, qtd, minimo, custo, venda, fornecedor };
  estoque.push(novo);
  salvarEstoque();
  carregarTabelas();
  const modalEl = document.getElementById('modalNovoItem');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
  $('#formNovoItem').reset();
  alert(`Item "${nome}" adicionado!`);
}

function abrirDetalhesItem(id){
  const item = estoque.find(i => i.id === id);
  if (!item) return;
  const html = `
    <p><strong>Nome:</strong> ${item.nome}</p>
    <p><strong>Código:</strong> ${item.codigo}</p>
    <p><strong>Categoria:</strong> ${item.categoria.toUpperCase()}</p>
    <p><strong>Fornecedor:</strong> ${item.fornecedor || '—'}</p>
    <hr>
    <p><strong>Qtd. em Estoque:</strong> <span class="fw-bold">${item.qtd}</span></p>
    <p><strong>Estoque Mínimo:</strong> ${item.minimo}</p>
    <p><strong>Preço Custo (Un.):</strong> ${money(item.custo)}</p>
    <p><strong>Preço Venda (Un.):</strong> ${money(item.venda)}</p>
    <p><strong>Margem de Lucro:</strong> <span class="text-success fw-bold">${marginPct(item.custo,item.venda)}</span></p>
  `;
  $('#corpoDetalhesItem').innerHTML = html;
  $('#btnExcluirItem').onclick = () => excluirItem(id);
  new bootstrap.Modal(document.getElementById('modalVerDetalhes')).show();
}

function excluirItem(id){
  if (!confirm('Excluir este item do estoque?')) return;
  estoque = estoque.filter(i => i.id !== id);
  salvarEstoque();
  carregarTabelas();
  const modalEl = document.getElementById('modalVerDetalhes');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
  alert('Item excluído com sucesso!');
}

function gerarPedidoCompra(){
  const criticos = estoque.filter(i => i.qtd < i.minimo);
  if (criticos.length === 0){
    alert('Não há itens críticos.');
    return;
  }
  const lista = criticos.map(i => `- ${i.nome} (Pedir: ${i.minimo - i.qtd} un. | Fornecedor: ${i.fornecedor || '—'})`).join('\n');
  alert(`Geração de Pedido (simulação):\n\n${lista}\n\n*No sistema real, geraria PDF ou enviaria e-mail.*`);
}

function simularVenda(servico){
  alert(`Simulação de Venda: ${servico}\n\nAbriria OS, abateria peças do estoque e registraria a receita.`);
}

// ======= Vendas rápidas (render fixo) =======
const vendasRapidas = [
  { servico:'Troca de Óleo + Filtros', pecas:'Óleo 5W30 (4L), Filtro de Óleo, Filtro de Ar', maoObra:80, preco:300 },
  { servico:'Revisão de Freios Dianteiros', pecas:'Pastilhas Dianteiras (par)', maoObra:150, preco:399 },
  { servico:'Troca de Bateria', pecas:'Bateria 60ah', maoObra:40, preco:490 },
  { servico:'Troca de Amortecedores (Par)', pecas:'Amortecedores (2), Kit Batente (2)', maoObra:250, preco:950 }
];
function renderVendas(){
  const tbody = $('#tabelaVendasRapidas');
  tbody.innerHTML = vendasRapidas.map(v => `
    <tr>
      <td class="fw-bold">${v.servico}</td>
      <td>${v.pecas}</td>
      <td class="text-end">${money(v.maoObra)}</td>
      <td class="text-end text-success fw-bold">${money(v.preco)}</td>
      <td class="text-center"><button class="btn btn-sm btn-success" onclick="simularVenda('${v.servico.replace(/'/g,"\\'")}')">Vender Serviço</button></td>
    </tr>
  `).join('');
}

// ======= Listeners =======
function listeners(){
  // Filtros
  $('#btnFiltrarEstoque').addEventListener('click', ()=> {
    const busca = $('#inputPesquisa').value;
    const cat = $('#selectFiltroCategoria').value;
    carregarTabelas(busca, cat);
  });
  $('#btnLimparFiltros').addEventListener('click', ()=> {
    $('#inputPesquisa').value = '';
    $('#selectFiltroCategoria').value = '';
    carregarTabelas();
  });
  $('#inputPesquisa').addEventListener('keyup', e => {
    const cat = $('#selectFiltroCategoria').value;
    carregarTabelas(e.target.value, cat);
  });
  $('#selectFiltroCategoria').addEventListener('change', e => {
    const busca = $('#inputPesquisa').value;
    carregarTabelas(busca, e.target.value);
  });

  // Ações em tabelas (delegação)
  document.body.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    const action = btn.dataset.action;
    if (action === 'ver') abrirDetalhesItem(id);
    if (action === 'pedido'){
      const item = estoque.find(i => i.id === id);
      if (!item) return;
      alert(`Pedido para "${item.nome}" (simulado).`);
    }
  });

  // Botões principais
  $('#btnSalvarItem').addEventListener('click', adicionarNovoItem);
  $('#btnGerarPedido').addEventListener('click', gerarPedidoCompra);

  // Tema
  $('#btnThemeToggle').addEventListener('click', alternarTema);
  const sw = $('#switchTema');
  if (sw){
    sw.addEventListener('change', () => {
      const toDark = sw.checked;
      document.documentElement.setAttribute('data-theme', toDark ? 'dark' : 'light');
      localStorage.setItem(STORAGE_KEYS.THEME, toDark ? 'dark' : 'light');
      atualizarIconeTemaBtn();
    });
  }

  // Accent (primária)
  $$('.color-pill').forEach(btn => {
    btn.addEventListener('click', () => aplicarAcento(btn.dataset.color));
  });
}

// ======= Init =======
window.addEventListener('DOMContentLoaded', () => {
  aplicarTemaInicial();
  aplicarAcentoInicial();
  renderVendas();
  carregarTabelas();
  listeners();
});
