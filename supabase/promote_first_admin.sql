-- Rode isso manualmente no SQL Editor do Supabase, UMA vez, depois que você
-- já tiver criado sua própria conta pelo fluxo normal de signup.
-- Isso promove seu usuário a admin, o resto do sistema (RLS, rotas,
-- funções de relatório) já reconhece automaticamente a partir do papel
-- gravado em `profiles`.

update public.profiles
set role = 'admin', status = 'approved'
where email = 'SEU-EMAIL-AQUI@exemplo.com';
