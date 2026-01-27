import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';

// Styled Components
const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const AddButton = styled.button`
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const Th = styled.th`
  background: linear-gradient(135deg, #4472c4, #3b5998);
  color: white;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
`;

const Tr = styled.tr`
  &:hover {
    background-color: #f8f9fa;
  }
`;

const RoleBadge = styled.span<{ role: string }>`
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  ${props => {
        switch (props.role) {
            case 'admin':
                return 'background: #fee2e2; color: #dc2626;';
            case 'manager':
                return 'background: #fef3c7; color: #d97706;';
            default:
                return 'background: #dbeafe; color: #2563eb;';
        }
    }}
`;

const StatusBadge = styled.span<{ active: boolean }>`
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  ${props => props.active
        ? 'background: #dcfce7; color: #16a34a;'
        : 'background: #f3f4f6; color: #6b7280;'
    }
`;

const ActionButton = styled.button<{ variant?: 'edit' | 'toggle' | 'delete' }>`
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  margin-right: 0.5rem;
  transition: all 0.2s;

  ${props => {
        switch (props.variant) {
            case 'edit':
                return 'background: #dbeafe; color: #2563eb; &:hover { background: #bfdbfe; }';
            case 'toggle':
                return 'background: #fef3c7; color: #d97706; &:hover { background: #fde68a; }';
            case 'delete':
                return 'background: #fee2e2; color: #dc2626; &:hover { background: #fecaca; }';
            default:
                return 'background: #e5e7eb; color: #374151; &:hover { background: #d1d5db; }';
        }
    }}
`;

// Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  font-size: 1.4rem;
  margin-bottom: 1.5rem;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #4472c4;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4472c4;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 0.85rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.variant === 'primary'
        ? `
      background: linear-gradient(135deg, #4472c4, #3b5998);
      color: white;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(68, 114, 196, 0.3);
      }
    `
        : `
      background: #f3f4f6;
      color: #374151;
      &:hover {
        background: #e5e7eb;
      }
    `
    }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const HelpText = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const InfoBox = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: #0369a1;
`;

// Types
interface User {
    id: number;
    username: string;
    role: 'staff' | 'manager' | 'admin';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface EditModalProps {
    user: User | null;
    mode: 'create' | 'edit';
    onClose: () => void;
    onSave: () => void;
}

// Edit Modal Component
const EditModal: React.FC<EditModalProps> = ({ user, mode, onClose, onSave }) => {
    const [username, setUsername] = useState(user?.username || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<string>(user?.role || 'staff');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'create') {
                // Create new user
                if (!username || !password) {
                    toast.error('Username and password are required');
                    setLoading(false);
                    return;
                }

                await axios.post('/admin/users', {
                    username,
                    password,
                    role
                });
                toast.success('User created successfully');
            } else {
                // Update existing user credentials
                const updates: any = {};
                if (username && username !== user?.username) {
                    updates.username = username;
                }
                if (password) {
                    updates.password = password;
                }

                if (Object.keys(updates).length === 0) {
                    toast.warning('No changes to save');
                    setLoading(false);
                    return;
                }

                await axios.put(`/admin/users/${user?.id}/credentials`, updates);
                toast.success('User credentials updated successfully');
            }

            onSave();
            onClose();
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error(error.response?.data?.error || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <ModalTitle>
                    {mode === 'create' ? '➕ Create New User' : '✏️ Edit User Credentials'}
                </ModalTitle>

                {mode === 'edit' && (
                    <InfoBox>
                        ℹ️ Leave password empty to keep the current password unchanged.
                    </InfoBox>
                )}

                <form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label>Username *</Label>
                        <Input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value.toLowerCase())}
                            placeholder="Enter username"
                            required={mode === 'create'}
                        />
                        <HelpText>Usernames are case-insensitive</HelpText>
                    </FormGroup>

                    <FormGroup>
                        <Label>{mode === 'create' ? 'Password *' : 'New Password'}</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={mode === 'create' ? 'Enter password' : 'Enter new password (optional)'}
                            required={mode === 'create'}
                            minLength={4}
                        />
                        <HelpText>Minimum 4 characters</HelpText>
                    </FormGroup>

                    {mode === 'create' && (
                        <FormGroup>
                            <Label>Role *</Label>
                            <Select value={role} onChange={e => setRole(e.target.value)}>
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </Select>
                        </FormGroup>
                    )}

                    <ButtonRow>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Saving...' : (mode === 'create' ? 'Create User' : 'Save Changes')}
                        </Button>
                    </ButtonRow>
                </form>
            </ModalContent>
        </ModalOverlay>
    );
};

// Main Component
const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');
    const [showModal, setShowModal] = useState(false);

    const isAdmin = currentUser?.role === 'admin';

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get<{ users: User[] }>('/admin/users');
            setUsers(response.data.users || []);
        } catch (error: any) {
            console.error('Fetch users error:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    // Check if current user is admin - AFTER all hooks
    if (!isAdmin) {
        return (
            <Container>
                <Title>🚫 Access Denied</Title>
                <p>Only administrators can access user management.</p>
            </Container>
        );
    }

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingUser(null);
        setModalMode('create');
        setShowModal(true);
    };

    const handleToggleStatus = async (user: User) => {
        if (user.id === currentUser?.id) {
            toast.error('You cannot deactivate your own account');
            return;
        }

        try {
            await axios.put(`/admin/users/${user.id}/status`, {
                isActive: !user.isActive
            });
            toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update status');
        }
    };

    const handleChangeRole = async (user: User, newRole: string) => {
        if (user.id === currentUser?.id) {
            toast.error('You cannot change your own role');
            return;
        }

        try {
            await axios.put(`/admin/users/${user.id}/role`, { role: newRole });
            toast.success(`Role changed to ${newRole} successfully`);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update role');
        }
    };

    const handleDelete = async (user: User) => {
        if (user.id === currentUser?.id) {
            toast.error('You cannot delete your own account');
            return;
        }

        if (!window.confirm(`Are you sure you want to permanently delete user "${user.username}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`/admin/users/${user.id}`);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete user');
        }
    };

    return (
        <Container>
            <HeaderRow>
                <Title>👥 User Management</Title>
                <AddButton onClick={handleCreate}>
                    ➕ Add New User
                </AddButton>
            </HeaderRow>

            {loading ? (
                <p>Loading users...</p>
            ) : (
                <Table>
                    <thead>
                        <tr>
                            <Th>ID</Th>
                            <Th>Username</Th>
                            <Th>Role</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <Tr key={user.id}>
                                <Td>{user.id}</Td>
                                <Td>
                                    <strong>{user.username}</strong>
                                    {user.id === currentUser?.id && (
                                        <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#6b7280' }}>(You)</span>
                                    )}
                                </Td>
                                <Td>
                                    <Select
                                        value={user.role}
                                        onChange={e => handleChangeRole(user, e.target.value)}
                                        disabled={user.id === currentUser?.id}
                                        style={{ padding: '0.4rem', borderRadius: '6px', fontSize: '0.85rem' }}
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </Select>
                                </Td>
                                <Td>
                                    <StatusBadge active={user.isActive}>
                                        {user.isActive ? '✅ Active' : '⛔ Inactive'}
                                    </StatusBadge>
                                </Td>
                                <Td>
                                    <ActionButton variant="edit" onClick={() => handleEdit(user)}>
                                        🔑 Password
                                    </ActionButton>
                                    <ActionButton
                                        variant="toggle"
                                        onClick={() => handleToggleStatus(user)}
                                        disabled={user.id === currentUser?.id}
                                    >
                                        {user.isActive ? '🔒 Deactivate' : '🔓 Activate'}
                                    </ActionButton>
                                    <ActionButton
                                        variant="delete"
                                        onClick={() => handleDelete(user)}
                                        disabled={user.id === currentUser?.id}
                                    >
                                        🗑️ Delete
                                    </ActionButton>
                                </Td>
                            </Tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {showModal && (
                <EditModal
                    user={editingUser}
                    mode={modalMode}
                    onClose={() => setShowModal(false)}
                    onSave={fetchUsers}
                />
            )}
        </Container>
    );
};

export default UserManagement;
