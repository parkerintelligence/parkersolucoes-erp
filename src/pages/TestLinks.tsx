import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TestLinks = () => {
  const { data: passwords = [], isLoading } = useQuery({
    queryKey: ['passwords-test'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passwords')
        .select('*')
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="p-4 text-white">Carregando...</div>;
  }

  return (
    <div className="p-4 bg-slate-900 min-h-screen">
      <h1 className="text-white text-xl mb-4">Teste de Links</h1>
      <div className="text-white">
        <p>Total de passwords: {passwords.length}</p>
        {passwords.map((password) => (
          <div key={password.id} className="bg-slate-800 p-2 mb-2 rounded">
            <p>{password.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestLinks;