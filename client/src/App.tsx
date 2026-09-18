import { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Estoque from './pages/Estoque';
import Orcamentos from './pages/Orcamentos';
import Vendas from './pages/Vendas';
import Despesas from './pages/Despesas';
import Assinatura from './pages/Assinatura';

function PrivateArea() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-brand-700">
        Carregando...
      </div>
    );
  }

  if (!user) return <Navigate to="/entrar" replace />;

  if (!user.subscription.hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7f6] px-4">
        <Assinatura />
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/orcamentos" element={<Orcamentos />} />
        <Route path="/vendas" element={<Vendas />} />
        <Route path="/despesas" element={<Despesas />} />
        <Route path="/assinatura" element={<Assinatura />} />
        <Route path="*" element={<Navigate to="/vendas" replace />} />
      </Routes>
    </Layout>
  );
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/vendas" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/entrar"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/cadastro"
          element={
            <PublicOnly>
              <Register />
            </PublicOnly>
          }
        />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/*" element={<PrivateArea />} />
      </Routes>
    </AuthProvider>
  );
}
