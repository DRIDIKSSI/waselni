import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/layout/Layout";
import { CookieConsent } from "./components/CookieConsent";
import { VisitorTracker } from "./components/VisitorTracker";

// Pages
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import CookiePolicy from "./pages/CookiePolicy";

// Requests
import RequestsList from "./pages/requests/RequestsList";
import NewRequest from "./pages/requests/NewRequest";
import RequestDetail from "./pages/requests/RequestDetail";

// Offers
import OffersList from "./pages/offers/OffersList";
import NewOffer from "./pages/offers/NewOffer";
import OfferDetail from "./pages/offers/OfferDetail";

// Messages
import MessagesList from "./pages/messages/MessagesList";
import Conversation from "./pages/messages/Conversation";

// Contracts
import ContractsList from "./pages/contracts/ContractsList";
import ContractDetail from "./pages/contracts/ContractDetail";

// Matching
import MatchingRequestOffers from "./pages/matching/MatchingRequestOffers";
import MatchingOfferRequests from "./pages/matching/MatchingOfferRequests";

// Admin
import AdminPanel from "./pages/admin/AdminPanel";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// App Routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/requests" element={<RequestsList />} />
      <Route path="/requests/:id" element={<RequestDetail />} />
      <Route path="/offers" element={<OffersList />} />
      <Route path="/offers/:id" element={<OfferDetail />} />
      <Route path="/u/:id" element={<PublicProfile />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/requests/new" element={
        <ProtectedRoute>
          <NewRequest />
        </ProtectedRoute>
      } />
      <Route path="/offers/new" element={
        <ProtectedRoute>
          <NewOffer />
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute>
          <MessagesList />
        </ProtectedRoute>
      } />
      <Route path="/messages/:id" element={
        <ProtectedRoute>
          <Conversation />
        </ProtectedRoute>
      } />
      <Route path="/contracts" element={
        <ProtectedRoute>
          <ContractsList />
        </ProtectedRoute>
      } />
      <Route path="/contracts/:id" element={
        <ProtectedRoute>
          <ContractDetail />
        </ProtectedRoute>
      } />
      <Route path="/matching/requests/:id" element={
        <ProtectedRoute>
          <MatchingRequestOffers />
        </ProtectedRoute>
      } />
      <Route path="/matching/offers/:id" element={
        <ProtectedRoute>
          <MatchingOfferRequests />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminPanel />
        </AdminRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <AppRoutes />
        </Layout>
        <CookieConsent />
        <VisitorTracker />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
