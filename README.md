# Lopes Tattoo — site estático editável

Site de três páginas para **Lopes Tattoo / Ícaro Lopes**, feito exclusivamente com HTML5, CSS3, arquivos JSON e JavaScript vanilla. Não há React, framework CSS, TypeScript, dependências npm, compilação, backend, banco de dados ou CMS. Depois de baixar a pasta, os arquivos-fonte podem ser editados diretamente no VS Code ou em qualquer editor de texto.

## Estrutura

```text
/
├── index.html                 Home
├── trabalhos/index.html       Galeria
├── contato/index.html         Contato e orçamento
├── css/style.css              Tokens, componentes, páginas e responsividade
├── js/main.js                 config.json, links de contato, menu e revelação ao rolar
├── js/gallery.js              Galeria, filtros, placeholders e lightbox
├── js/form.js                 Formulário WhatsApp e accordion de FAQ
├── data/config.json           Dados do cliente, flags e textos principais
├── data/trabalhos.json        Itens e imagens da galeria
├── data/faq.json              Perguntas e respostas
├── assets/trabalhos/          Coloque aqui as fotos autorizadas
├── assets/img/                Imagens de capa/retrato, se fornecidas
├── assets/icons/aranha.svg    Ícone provisório para favicon
├── assets/icons/brush.svg     Tarja SVG editorial editável
├── sitemap.xml                Atualizar com o domínio real antes de publicar
├── robots.txt                 Atualizar referência do sitemap antes de publicar
└── manus-routes.json          Rotas públicas declaradas ao Preview
```

## Como editar

**Contato e dados principais:** abra `data/config.json`. Altere `whatsapp` para o número completo em formato internacional, somente com dígitos (por exemplo `55` + DDD + número), e ajuste `whatsappExibicao`, `instagram`, `instagramUsuario`, `cidadeBase` e `mensagemWhatsappPadrao`. O número não fica copiado em HTML ou JavaScript: todos os botões, rodapé e formulário montam os links a partir desse JSON. As chaves em `flags` controlam os blocos de outras cidades e endereço; mantenha `mostrarEndereco` como `false` até existir um endereço aprovado para publicação. Para mostrar o bloco de endereço, preencha também `endereco`. `textos` guarda os títulos e parágrafos principais. Os textos-base também estão no HTML para que a página tenha conteúdo legível antes do JavaScript; o JSON atualiza esses trechos quando o site é servido. Ao alterar a cidade, revise também descrições SEO e `areaServed` no JSON-LD dentro dos três HTMLs.

**Trabalhos e fotos:** em `data/trabalhos.json`, cada item usa `id`, `arquivo`, `alt`, `legenda`, `categoria` (`floral`, `animais` ou `lettering`) e `destaque`. O valor `arquivo: null` mostra um placeholder editorial, sem fingir que existe uma foto. Para inserir uma imagem autorizada, copie o arquivo para `assets/trabalhos/` e mude `arquivo` para, por exemplo, `assets/trabalhos/floral-costas-01.webp`; escreva um `alt` descritivo e mantenha os caminhos relativos. Marque `destaque: true` para exibi-la na faixa da Home. A galeria aceita até 30 itens. Os nove registros com `slot: true` são espaços vazios de preparação, não trabalhos adicionais confirmados: substitua-os por fotos/dados reais ou remova-os. Um filtro por categoria aparece automaticamente quando há pelo menos três registros nela.

**Perguntas:** edite `data/faq.json` mantendo uma lista de objetos com `pergunta` e `resposta`. O terceiro item usa `requerFlag: "mostrarOutrasCidades"` e só aparece quando a mesma flag for verdadeira em `config.json`.

**Aparência e páginas:** cores, tipografia, espaçamentos, breakpoints e estados ficam em `css/style.css`. O conteúdo HTML está em `index.html`, `trabalhos/index.html` e `contato/index.html`; cada arquivo contém seu header, footer, navegação e botão flutuante, para manter os links e o conteúdo principal presentes no HTML inicial. O favicon/aranha é provisório e não deve ser tratado como logotipo oficial. `app.config.ts` é somente metadado de identidade do projeto Manus; não é dependência nem código de execução do site estático.

## Como testar localmente

O navegador bloqueia `fetch()` de JSON ao abrir `file://` diretamente. Sirva a pasta por HTTP. No terminal, dentro da pasta do projeto, execute:

```bash
python3 -m http.server 8000
```

Acesse `http://localhost:8000/`, `http://localhost:8000/trabalhos/` e `http://localhost:8000/contato/`. Também funciona com a extensão Live Server do VS Code. Não é necessário instalar pacotes ou executar um build.

## Publicação estática

A pasta pode ser enviada a Netlify, Vercel, GitHub Pages ou outra hospedagem estática. Publique os arquivos preservando a estrutura e os caminhos relativos. Antes de enviar a versão pública, confirme os itens abaixo; então substitua `https://SEU-DOMINIO.com/` em `sitemap.xml` e `robots.txt` pelo domínio canônico real. Atualize também canonical e URLs/imagens absolutas de compartilhamento no `<head>` das três páginas quando domínio e imagem de preview estiverem definidos. A arte abstrata atual do hero usa um asset durável do armazenamento Manus; ao mover para outra hospedagem, baixe/adicione uma cópia em `assets/img/` e troque o `src` da imagem em `index.html` por caminho relativo. Atualize também `imagemCompartilhamento` em `data/config.json` para essa cópia local; o JSON-LD e os metadados canonical/OG são atualizados pelo JavaScript a partir da origem pública. O sitemap, o robots e o manifesto de rotas devem acompanhar qualquer mudança de URL.

## Confirmações pendentes antes de publicar

- Confirmar que o telefone/WhatsApp informado é o canal atual e está correto.
- Confirmar se há atendimento ativo em Salvador ou em outras cidades, em que formato; a flag está desligada enquanto isso não for validado.
- Confirmar o nome oficial a usar no cabeçalho/domínio: “Lopes Tattoo”, “Ícaro Lopes” ou combinação.
- Receber fotos reais do portfólio com autorização de uso, selecionar os trabalhos e revisar as legendas/categorias. As três peças citadas no briefing aparecem apenas como rótulos com placeholder; as fotos de referência do RAR não foram usadas como trabalhos do artista.
- Confirmar se existe logo aprovado e se a aranha pode ser usada como assinatura. O favicon atual é uma solução provisória.
- Confirmar domínio público canônico, imagem Open Graph e, se aplicável, qualquer endereço elegível para exibição. Não há endereço/mapa no site.
- Conferir textos e políticas com o artista. Não há preços, horários, agenda aberta, promessas de segurança, credenciais ou depoimentos publicados.

## Privacidade e eventos

O formulário não envia dados para servidor nem os armazena: valida os campos no navegador e prepara uma mensagem para abrir no WhatsApp. O texto diz que os dados são usados apenas para responder ao pedido. Há comentários no JavaScript para futura integração de Analytics/Meta Pixel, mas nenhum rastreador está instalado ou ativado.
