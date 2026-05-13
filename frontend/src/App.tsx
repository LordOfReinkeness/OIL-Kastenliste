import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserSessionProvider } from './context/UserSessionContext';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import { Home } from './pages/Home';
import { LiveCheckin } from './pages/LiveCheckin';
import { LiveScreen } from './pages/LiveScreen';
import { PostCheckin } from './pages/PostCheckin';
import { AdminLayout } from './components/layout/AdminLayout';
import { Overview } from './pages/admin/Overview';
import { AdminMeetings } from './pages/admin/Meetings';
import { AdminUsers } from './pages/admin/Users';
import { AdminStandup } from './pages/admin/Standup';
import './App.module.css';

function App() {
  return (
    <UserSessionProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/live-checkin/:token" element={<LiveCheckin />} />
            <Route path="/live-screen/:token" element={<LiveScreen />} />
            <Route path="/post-checkin/:token" element={<PostCheckin />} />
            <Route path="/admin" element={<RequireAuth />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Overview />} />
                <Route path="meetings" element={<AdminMeetings />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="standup" element={<AdminStandup />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </UserSessionProvider>
  );
}

export default App;
