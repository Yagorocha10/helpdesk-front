# Integração pendente: rastreabilidade e indicadores

O front-end consulta atualmente as operações já usadas pelo sistema para listar pastas e documentos, enviar arquivos, consultar armazenamento, visualizar e baixar documentos. O contrato de documento disponível contém `id`, `nome`, `tipo`, `folderId`, `mimeType`, `tamanho` e `dataCriacao`.

## Histórico de versões

Não há operação ou dados de versões anteriores no contrato atual. Para exibir versões, o back-end precisa disponibilizar a lista vinculada a um documento com identificador/número da versão, data e horário e usuário responsável. Visualização e download de versões anteriores também dependem de operações suportadas pelo back-end. Até essa integração existir, a ação por arquivo abre uma mensagem informativa e não exibe versões simuladas.

## Atividades por arquivo e atividades recentes

Não há registro de eventos no contrato atual. Para preencher esses painéis, o back-end precisa disponibilizar os eventos vinculados ao documento e os eventos recentes do sistema, incluindo responsável, ação e data/horário. As ações consideradas pela interface podem incluir envio, visualização, download e edição, desde que o back-end as registre. A interface informa a indisponibilidade e não transforma ações locais em um histórico fictício.

## Departamento e categoria

O DTO atual não associa documentos a departamento nem expõe uma categoria. Esses indicadores precisam desses atributos e dos dados de classificação retornados pelo back-end. A barra disponível no Dashboard agrupa pelo campo existente `tipo` e é identificada como tipo de arquivo; ela não é apresentada como categoria.

## Indicadores já disponíveis

O total de documentos é derivado da listagem existente de documentos, o total de pastas da árvore retornada pela API e a lista de documentos recentes de `dataCriacao`. Se uma listagem falhar, o Dashboard sinaliza o erro em vez de preencher dados de exemplo.
