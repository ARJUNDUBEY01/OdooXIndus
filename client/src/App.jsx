import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Subscriptions from './pages/Subscriptions';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Products from './pages/Products';
import Plans from './pages/Plans';
import Discounts from './pages/Discounts';
import Tax from './pages/Tax';
import Reports from './pages/Reports';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#16161f',
              color: '#f0f0f8',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#10d98a', secondary: '#16161f' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#16161f' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/products" element={<Products />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/discounts" element={<Discounts />} />
            <Route path="/tax" element={<Tax />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
