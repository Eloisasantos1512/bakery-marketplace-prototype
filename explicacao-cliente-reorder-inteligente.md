# Como explicar: "Aprender o comportamento do cliente"

## O que o cliente pediu vs. o que vamos entregar

Quando o cliente fala em "aprender o comportamento do cliente", ele provavelmente está
imaginando algo vago tipo "IA que entende o cliente". Na prática, o que resolve a dor dele
de forma imediata é bem mais concreto: **prever quando cada cliente vai precisar repor um
produto, com base no próprio histórico de pedidos dele.**

Vale posicionar assim na conversa, sem prometer "IA mágica":

> "A gente não precisa de um modelo de inteligência artificial pra isso — o padrão de
> recompra em B2B de padaria é muito regular. Dá pra calcular isso direto no banco de
> dados, com os pedidos que o sistema já registra. Isso significa: mais rápido de
> construir, mais barato de manter, e funciona desde o segundo pedido do cliente."

## A dor que isso resolve (comece por aqui)

Não fale de "algoritmo" primeiro. Fale do problema do dia a dia do cliente do cliente
(a padaria que compra do fornecedor):

- Toda semana, o gerente da padaria refaz manualmente uma lista de compras que é quase
  idêntica à da semana anterior.
- Isso é tempo perdido e risco de esquecer algo (ficar sem farinha numa sexta é um
  problema operacional real pra ele).
- A gente elimina essa fricção: o sistema já sabe o que ele costuma pedir e quando.

## Como funciona, em uma frase

> "Toda vez que o cliente faz um pedido, o sistema guarda: o quê, quanto, e quando. Com
> só alguns pedidos de histórico, conseguimos calcular a frequência média de cada produto
> pra cada cliente — tipo 'esse cliente pede farinha a cada 7 dias, e já fazem 9 dias
> desde o último pedido'. Aí mostramos isso como uma sugestão de 'repetir pedido' com um
> clique."

## O que isso NÃO é (importante alinhar expectativa)

- **Não é** um modelo de machine learning treinado.
- **Não é** algo que precisa de "dados de mercado" ou dataset externo.
- **Não tem** cold-start problem grave — funciona a partir do 2º pedido do cliente (com
  confiança "baixa" nos primeiros pedidos, subindo para "alta" conforme o histórico cresce).
- **Não gera custo de infraestrutura de IA** — é uma consulta SQL sobre dados que o
  sistema já está armazenando de qualquer forma.

Isso é importante dizer porque desarma a pergunta seguinte, que costuma ser "quanto isso
vai custar" ou "quanto tempo isso atrasa o projeto". A resposta é: pouco, porque estamos
reaproveitando dado que já existe.

## Onde isso aparece pro cliente final

1. **App do cliente (padaria):** um card "Hora de repor" no topo do pedido, mostrando os
   produtos que estão "atrasados" em relação ao padrão de compra dele, com botão de
   1 clique pra adicionar ao carrinho.
2. **Console do fornecedor (seu cliente direto):** um painel de "contas que esfriaram" —
   clientes cujo padrão de compra caiu abaixo do esperado, um sinal de alerta pro
   representante comercial entrar em contato antes que o cliente migre pra outro
   fornecedor.

O segundo ponto costuma ser o que realmente convence quem está pagando pelo projeto,
porque é retenção de receita, não só conveniência.

## Onde automação (N8N) e "IA de verdade" entram — próxima fase

Depois que o cálculo de recência/frequência estiver rodando, existem duas extensões
naturais, e vale já sinalizar isso pro cliente como roadmap (não como parte do escopo
atual):

- **N8N / automação operacional:** o painel de "contas que esfriaram" pode disparar um
  fluxo automático — por exemplo, notificar o representante comercial no Slack/WhatsApp,
  ou criar uma tarefa no CRM, sem intervenção manual. Isso é automação de processo, não
  IA — é conectar um dado que já calculamos a uma ação.
- **IA generativa (LLM), se fizer sentido depois:** usar um modelo pra transformar os
  números em um resumo em linguagem natural pro representante comercial — por exemplo,
  "Padaria Bom Grão reduziu o volume de farinha em 30% nas últimas 3 semanas, o que é
  atípico pro padrão dela; considere ligar." Isso é opcional, custa mais (chamadas de
  modelo), e só compensa quando já existe volume de contas suficiente pra o resumo
  automático economizar tempo real do time comercial.

## Frase de fechamento sugerida pro cliente

> "A curto prazo, entregamos a base disso sem custo extra de infraestrutura, porque é só
> uma boa leitura dos dados que o sistema já vai guardar. A automação com N8N e a
> camada de IA generativa a gente trata como fase 2, quando já tivermos volume de pedidos
> suficiente pra isso valer a pena — não faz sentido pagar por complexidade que ainda não
> tem dado pra sustentar."
