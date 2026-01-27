import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import BulkApprovalModal from './BulkApprovalModal';

const Nav = styled.nav`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const NavContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  color: white;
  font-size: 1.5rem;
  margin: 0;
  font-weight: 700;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const NavLink = styled(Link) <{ $active: boolean }>`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-weight: 500;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
`;

const ApprovalButton = styled.button`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-weight: 500;
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  font-size: 1rem;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const UserInfo = styled.div`
  color: white;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserBadge = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-weight: 600;
  text-transform: capitalize;
`;

const LogoutButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'manager' || user.role === 'admin')) {
      fetchPendingCount();

      // Poll every 30 seconds for updates
      const interval = setInterval(() => {
        fetchPendingCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPendingCount = async () => {
    try {
      const response = await axios.get('/arrivals/pending-list');
      const data = response.data as { count: number };
      setPendingCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleApprovalModalClose = () => {
    setShowApprovalModal(false);
    fetchPendingCount(); // Refresh count when modal closes
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Nav>
      <NavContainer>
        <Logo>🏭 Mother India Stock Management</Logo>
        <NavLinks>
          <NavLink to="/dashboard" $active={isActive('/dashboard')}>
            Dashboard
          </NavLink>
          <NavLink to="/arrivals" $active={isActive('/arrivals')}>
            Arrivals
          </NavLink>
          <NavLink to="/records" $active={isActive('/records')}>
            Records
          </NavLink>
          <NavLink to="/ledger" $active={isActive('/ledger')}>
            Kunchinittu Ledger
          </NavLink>
          <NavLink to="/rice-ledger" $active={isActive('/rice-ledger')}>
            Rice Ledger
          </NavLink>
          <NavLink to="/hamali" $active={isActive('/hamali')}>
            Hamali
          </NavLink>
          {user && (user.role === 'manager' || user.role === 'admin') && (
            <>
              <NavLink to="/hamali-book" $active={isActive('/hamali-book')}>
                Hamali Book
              </NavLink>
            </>
          )}
          {user && (user.role === 'manager' || user.role === 'admin') && (
            <>
              <NavLink to="/locations" $active={isActive('/locations')}>
                Locations
              </NavLink>
              {pendingCount > 0 && (
                <ApprovalButton onClick={() => setShowApprovalModal(true)}>
                  🔔 Pending Arrivals
                  <NotificationBadge>{pendingCount}</NotificationBadge>
                </ApprovalButton>
              )}
            </>
          )}
          {user && user.role === 'admin' && (
            <NavLink to="/admin/users" $active={isActive('/admin/users')}>
              👥 Users
            </NavLink>
          )}
          <UserInfo>
            <UserBadge>{user?.role}</UserBadge>
            <span>{user?.username}</span>
          </UserInfo>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </NavLinks>
      </NavContainer>

      <BulkApprovalModal
        isOpen={showApprovalModal}
        onClose={handleApprovalModalClose}
        onApprovalComplete={fetchPendingCount}
      />
    </Nav>
  );
};

export default Navbar;