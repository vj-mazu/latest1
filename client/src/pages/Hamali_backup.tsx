import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';
import InlinePaddyHamaliForm from '../components/InlinePaddyHamaliForm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Container = styled.div`
  animation: fadeIn 0.5s ease-in;
`;

const Title = styled.h1`
  color: #ffffff;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
`;

const FilterSection = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
`;

const InfoText = styled.p`
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #10b981;
  }
`;

const RecordsContainer = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
`;

const DateGroup = styled.div<{ expanded: boolean }>`
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #f3f4f6;
  }
`;

const DateTitle = styled.h3`
  color: #1f2937;
  font-size: 1.1rem;
  margin: 0;
`;

const RecordCount = styled.span`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
`;

const LoadHamaliButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;

const PDFDownloadButton = styled.button`
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  width: 100%;
  margin: 0;
  padding: 0;
  
  /* Ensure table extends to edges */
  table {
    margin: 0;
    border-left: none;
    border-right: none;
  }
`;

const ExcelTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: 'Calibri', 'Arial', sans-serif;
  font-size: 10pt;
  background: white;

  thead {
    background: #4472c4;
    color: white;
    font-weight: bold;
  }

  th, td {
    border: 1px solid #d0d0d0;
    padding: 4px 6px;
    text-align: left;
  }

  th {
    font-weight: bold;
    white-space: nowrap;
    font-size: 9pt;
  }

  tbody tr:nth-child(even) {
    background: #f8f9fa;
  }

  tbody tr:hover {
    background: #e8f4f8;
  }
`;

const PurchaseRow = styled.tr`
  background: #d4edda !important;
  
  &:hover {
    background: #c3e6cb !important;
  }
`;

const ShiftingRow = styled.tr`
  background: #e2d4ed !important;
  
  &:hover {
    background: #d4c3e6 !important;
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    switch (props.status) {
      case 'pending':
        return 'background: #fef3c7; color: #d97706;';
      case 'approved':
        return 'background: #d1fae5; color: #059669;';
      case 'rejected':
        return 'background: #fee2e2; color: #dc2626;';
      default:
        return 'background: #e5e7eb; color: #6b7280;';
    }
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  padding: 0.5rem;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #e5e7eb;
  }

  &.edit:hover {
    background: #fef3c7;
    color: #f59e0b;
  }

  &.delete:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  &.approve:hover {
    background: #d1fae5;
    color: #059669;
  }
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: #6b7280;
`;

interface Arrival {
  id: number;
  slNo: string;
  date: string;
  movementType: string;
  broker?: string;
  variety?: string;
  bags?: number;
  fromLocation?: string;
  toKunchinintuId?: number;
  toKunchinittu?: { name: string; code?: string };
  toWarehouse?: { name: string; code?: string };
  fromKunchinittu?: { name: string; code?: string };
  fromWarehouse?: { name: string; code?: string };
  toWarehouseShift?: { name: string; code?: string };
  outturnId?: number;
  outturn?: { code: string; allottedVariety?: string; isCleared?: boolean; clearedAt?: string };
  moisture?: number;
  cutting?: string;
  wbNo: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  lorryNumber: string;
  status: string;
  creator?: { username: string };
  approver?: { username: string; role: string };
  adminApprover?: { username: string; role: string };
  adminApprovedBy?: number;
}

const Hamali: React.FC = () => {
  const { user } = useAuth();
  const [hamaliDate, setHamaliDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hamaliRecords, setHamaliRecords] = useState<Arrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHamali, setLoadingHamali] = useState(false);
  const [hamaliLoaded, setHamaliLoaded] = useState(false);
  const [selectedArrivalForHamali, setSelectedArrivalForHamali] = useState<any>(null);
  const [paddyHamaliEntries, setPaddyHamaliEntries] = useState<{ [key: number]: any[] }>({});
  const [otherHamaliEntries, setOtherHamaliEntries] = useState<{ [key: number]: any[] }>({});
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchHamaliRecords();
  }, [hamaliDate]);

  // Force load hamali entries for the specific test date
  useEffect(() => {
    if (hamaliDate === '2025-06-29' && hamaliRecords.length > 0 && !hamaliLoaded) {
      console.log('🎯 Force loading hamali entries for test date');
      const arrivalIds = hamaliRecords.map(r => r.id);
      fetchPaddyHamaliEntries(arrivalIds);
    }
  }, [hamaliDate, hamaliRecords, hamaliLoaded]);

  const fetchHamaliRecords = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const params: any = {
        dateFrom: hamaliDate,
        dateTo: hamaliDate
      };

      // OPTIMIZED: Only fetch arrivals first, hamali entries loaded on demand
      const response = await axios.get('/records/arrivals', { params });
      const data = response.data as { records: { [key: string]: Arrival[] } };

      // Flatten all records from all dates
      const allRecords = Object.values(data.records || {}).flat();
      
      // Ensure numeric fields are properly converted
      const processedRecords = allRecords.map(record => ({
        ...record,
        grossWeight: typeof record.grossWeight === 'string' ? parseFloat(record.grossWeight) || 0 : record.grossWeight || 0,
        tareWeight: typeof record.tareWeight === 'string' ? parseFloat(record.tareWeight) || 0 : record.tareWeight || 0,
        netWeight: typeof record.netWeight === 'string' ? parseFloat(record.netWeight) || 0 : record.netWeight || 0,
      }));
      
      setHamaliRecords(processedRecords);

      // OPTIMIZED: Auto-load hamali entries for reasonable datasets to show status immediately
      const arrivalIds = allRecords.map(r => r.id);
      console.log(`📊 Found ${arrivalIds.length} arrivals for ${hamaliDate}`);
      
      if (arrivalIds.length > 0 && arrivalIds.length <= 200) {
        // Auto-load for reasonable datasets (increased threshold)
        console.log('🚀 Auto-loading hamali entries...');
        fetchPaddyHamaliEntries(arrivalIds);
      } else if (arrivalIds.length > 200) {
        // For very large datasets, don't auto-load
        console.log('⚠️ Too many arrivals, not auto-loading hamali entries');
        setHamaliLoaded(false);
        setPaddyHamaliEntries({});
        setOtherHamaliEntries({});
      } else {
        // No arrivals
        setHamaliLoaded(false);
        setPaddyHamaliEntries({});
        setOtherHamaliEntries({});
      }

      const loadTime = Date.now() - startTime;
      if (loadTime > 1000) {
        console.warn(`⚠️ Slow arrivals load: ${loadTime}ms for ${hamaliDate}`);
      }
    } catch (error) {
      console.error('Error fetching hamali records:', error);
      toast.error('Failed to fetch records for hamali');
      setHamaliRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaddyHamaliEntries = async (arrivalIds: number[]) => {
    setLoadingHamali(true);
    const startTime = Date.now();
    
    try {
      // OPTIMIZED: Batch fetch instead of individual requests
      const paddyEntriesMap: { [key: number]: any[] } = {};
      const otherEntriesMap: { [key: number]: any[] } = {};

      if (arrivalIds.length === 0) return;

      // Batch fetch with comma-separated IDs
      const idsParam = arrivalIds.join(',');
      
      const [paddyResponse, otherResponse] = await Promise.all([
        axios.get<{ entries: any[] }>(`/paddy-hamali-entries/batch?arrivalIds=${idsParam}`).catch(() => ({ data: { entries: [] } })),
        axios.get<{ entries: any[] }>(`/other-hamali-entries/batch?arrivalIds=${idsParam}`).catch(() => ({ data: { entries: [] } }))
      ]);

      // Group entries by arrival ID
      if (paddyResponse.data.entries) {
        console.log('🌾 Paddy entries received:', paddyResponse.data.entries.length);
        paddyResponse.data.entries.forEach((entry: any) => {
          if (!paddyEntriesMap[entry.arrivalId]) {
            paddyEntriesMap[entry.arrivalId] = [];
          }
          paddyEntriesMap[entry.arrivalId].push(entry);
        });
      }

      if (otherResponse.data.entries) {
        console.log('🔧 Other entries received:', otherResponse.data.entries.length);
        otherResponse.data.entries.forEach((entry: any) => {
          if (!otherEntriesMap[entry.arrivalId]) {
            otherEntriesMap[entry.arrivalId] = [];
          }
          otherEntriesMap[entry.arrivalId].push(entry);
        });
      }

      console.log('📊 Final hamali maps:', {
        paddyEntriesMap: Object.keys(paddyEntriesMap).length,
        otherEntriesMap: Object.keys(otherEntriesMap).length,
        paddyEntries: Object.values(paddyEntriesMap).flat().length,
        otherEntries: Object.values(otherEntriesMap).flat().length
      });

      setPaddyHamaliEntries(paddyEntriesMap);
      setOtherHamaliEntries(otherEntriesMap);
      setHamaliLoaded(true);

      const loadTime = Date.now() - startTime;
      toast.success(`⚡ Loaded hamali entries in ${loadTime}ms`);
    } catch (error) {
      console.error('Error fetching hamali entries:', error);
      toast.error('Failed to load hamali entries');
    } finally {
      setLoadingHamali(false);
    }
  };

  const handleEditEntry = (entry: any, entryType: 'paddy' | 'other') => {
    setEditingEntry({ ...entry, entryType });
    setEditForm({
      rate: entry.rate?.toString() || '',
      bags: entry.bags?.toString() || '',
      workerName: entry.workerName || '',
      batchNumber: entry.batchNumber?.toString() || '1',
      description: entry.description || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !editForm.rate || !editForm.bags) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = editingEntry.entryType === 'paddy' 
        ? `/paddy-hamali-entries/${editingEntry.id}`
        : `/other-hamali-entries/${editingEntry.id}`;

      const updateData: any = {
        workType: editingEntry.workType,
        workDetail: editingEntry.workDetail,
        rate: parseFloat(editForm.rate),
        bags: parseInt(editForm.bags)
      };

      if (editingEntry.entryType === 'paddy') {
        updateData.workerName = editForm.workerName;
        updateData.batchNumber = parseInt(editForm.batchNumber);
      } else {
        updateData.description = editForm.description;
      }

      await axios.put(endpoint, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Hamali entry updated successfully');
      
      // Refresh the hamali entries
      const arrivalIds = hamaliRecords.map(r => r.id);
      if (arrivalIds.length > 0) {
        fetchPaddyHamaliEntries(arrivalIds);
      }
      
      handleCancelEdit();
    } catch (error: any) {
      console.error('Error updating hamali entry:', error);
      toast.error(error.response?.data?.error || 'Failed to update hamali entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container>
      <Title>💰 Hamali Management</Title>

      {/* Date Filter for Hamali */}
      <FilterSection>
        <FilterRow>
          <FormGroup>
            <Label>Select Date</Label>
            <Input
              type="date"
              value={hamaliDate}
              onChange={(e) => setHamaliDate(e.target.value)}
            />
            <InfoText>Select date to view arrivals for hamali entry</InfoText>
          </FormGroup>
        </FilterRow>
      </FilterSection>

      {/* Hamali Records Display */}
      {loading ? (
        <EmptyState>
          <div className="spinner"></div>
          <p>Loading records...</p>
        </EmptyState>
      ) : hamaliRecords.length === 0 ? (
        <EmptyState>
          <p>📭 No arrivals found for {new Date(hamaliDate).toLocaleDateString('en-GB')}</p>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Select a different date to view arrivals</p>
        </EmptyState>
      ) : (
        <RecordsContainer>
          <DateGroup expanded={true}>
            <DateHeader>
              <DateTitle>
                📅 {new Date(hamaliDate).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </DateTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <RecordCount>{hamaliRecords.length} arrivals</RecordCount>
                {!hamaliLoaded && (
                  <LoadHamaliButton
                    onClick={() => {
                      console.log('🔘 Manual load button clicked');
                      const arrivalIds = hamaliRecords.map(r => r.id);
                      console.log(`📊 Loading hamali for ${arrivalIds.length} arrivals`);
                      fetchPaddyHamaliEntries(arrivalIds);
                    }}
                    disabled={loadingHamali}
                    style={{
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    {loadingHamali ? '⚡ Loading...' : '🚨 CLICK TO LOAD HAMALI STATUS'}
                  </LoadHamaliButton>
                )}
                {hamaliLoaded && (
                  <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: '600' }}>
                    ✅ Hamali entries loaded
                  </span>
                )}
              </div>
            </DateHeader>

            <TableContainer>
              <ExcelTable>
                <thead>
                  <tr>
                    <th>Sl No</th>
                    <th>Date</th>
                    <th>Type of Movement</th>
                    <th>Broker</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Variety</th>
                    <th>Bags</th>
                    <th>Moisture</th>
                    <th>Cutting</th>
                    <th>Wb No</th>
                    <th>Gross Weight</th>
                    <th>Tare Weight</th>
                    <th>Net Weight</th>
                    <th>Lorry No</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hamaliRecords.map((record) => {
                    const RowComponent = record.movementType === 'purchase' ? PurchaseRow : 
                                       record.movementType === 'shifting' ? ShiftingRow : 'tr';

                    return (
                      <React.Fragment key={record.id}>
                        <RowComponent>
                          <td>{record.slNo}</td>
                          <td>{new Date(record.date).toLocaleDateString('en-GB')}</td>
                          <td style={{ textTransform: 'capitalize' }}>
                            {record.movementType === 'production-shifting' ? 'Production Shifting' : record.movementType}
                          </td>
                          <td>{record.broker || '-'}</td>
                          <td>
                            {record.movementType === 'purchase' ? (record.fromLocation || '-') :
                             record.movementType === 'shifting' ? 
                               `${record.fromKunchinittu?.code || '-'} (${record.fromWarehouse?.code || '-'})` :
                             record.movementType === 'production-shifting' ?
                               `${record.fromKunchinittu?.code || '-'} (${record.fromWarehouse?.code || '-'})` : '-'}
                          </td>
                          <td>
                            {record.movementType === 'purchase' ? 
                              `${record.toKunchinittu?.code || '-'} (${record.toWarehouse?.code || '-'})` :
                             record.movementType === 'shifting' ? 
                               `${record.toKunchinittu?.code || '-'} (${record.toWarehouseShift?.code || '-'})` :
                             record.movementType === 'production-shifting' ?
                               `${record.outturn?.code || '-'}` : '-'}
                          </td>
                          <td>
                            {record.variety || '-'}
                          </td>
                          <td>{record.bags || '-'}</td>
                          <td>{record.moisture ? `${record.moisture}%` : '-'}</td>
                          <td>{record.cutting || '-'}</td>
                          <td>{record.wbNo}</td>
                          <td>{record.grossWeight.toFixed(2)}</td>
                          <td>{record.tareWeight.toFixed(2)}</td>
                          <td style={{ fontWeight: 'bold' }}>{record.netWeight.toFixed(2)}</td>
                          <td>{record.lorryNumber}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <StatusBadge status={record.status}>
                                {record.status}
                              </StatusBadge>
                              {/* Hamali Status Indicator */}
                              {hamaliLoaded && (
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                  {paddyHamaliEntries[record.id] && paddyHamaliEntries[record.id].length > 0 && (
                                    <span style={{
                                      background: '#d1fae5',
                                      color: '#059669',
                                      padding: '2px 6px',
                                      borderRadius: '12px',
                                      fontSize: '0.7rem',
                                      fontWeight: '600',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px'
                                    }}>
                                      ✓ PADDY ({paddyHamaliEntries[record.id].length})
                                    </span>
                                  )}
                                  {otherHamaliEntries[record.id] && otherHamaliEntries[record.id].length > 0 && (
                                    <span style={{
                                      background: '#ddd6fe',
                                      color: '#7c3aed',
                                      padding: '2px 6px',
                                      borderRadius: '12px',
                                      fontSize: '0.7rem',
                                      fontWeight: '600',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px'
                                    }}>
                                      ✓ OTHER ({otherHamaliEntries[record.id].length})
                                    </span>
                                  )}
                                  {(!paddyHamaliEntries[record.id] || paddyHamaliEntries[record.id].length === 0) && 
                                   (!otherHamaliEntries[record.id] || otherHamaliEntries[record.id].length === 0) && (
                                    <span style={{
                                      background: '#fee2e2',
                                      color: '#dc2626',
                                      padding: '2px 6px',
                                      borderRadius: '12px',
                                      fontSize: '0.7rem',
                                      fontWeight: '600'
                                    }}>
                                      NO HAMALI
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <ActionButtons>
                              {/* Add Hamali button - For all records (not loose) - All roles can add */}
                              {record.movementType !== 'loose' && (
                                <IconButton
                                  className="approve"
                                  onClick={() => {
                                    if (selectedArrivalForHamali?.id === record.id) {
                                      setSelectedArrivalForHamali(null);
                                    } else {
                                      // Validate required fields before opening modal
                                      if (!record.slNo || !record.id) {
                                        toast.error('Unable to load arrival information. Missing required fields.');
                                        return;
                                      }
                                      if (!record.bags || record.bags <= 0) {
                                        toast.error('Cannot add hamali to arrival with no bags.');
                                        return;
                                      }
                                      setSelectedArrivalForHamali(record);
                                    }
                                  }}
                                  title={(() => {
                                    if (selectedArrivalForHamali?.id === record.id) return "Close Form";
                                    
                                    const paddyCount = paddyHamaliEntries[record.id]?.length || 0;
                                    const otherCount = otherHamaliEntries[record.id]?.length || 0;
                                    const totalCount = paddyCount + otherCount;
                                    
                                    if (totalCount > 0) {
                                      return `✓ Hamali Already Added - Paddy: ${paddyCount}, Other: ${otherCount}`;
                                    }
                                    
                                    return hamaliLoaded ? "Add Hamali (No entries yet)" : "Click 'Load Hamali Entries' first";
                                  })()}
                                  style={(() => {
                                    if (selectedArrivalForHamali?.id === record.id) {
                                      return { 
                                        background: '#6b7280', 
                                        position: 'relative' as const
                                      };
                                    }
                                    
                                    const hasPaddyHamali = paddyHamaliEntries[record.id]?.length > 0;
                                    const hasOtherHamali = otherHamaliEntries[record.id]?.length > 0;
                                    const hasAnyHamali = hasPaddyHamali || hasOtherHamali;
                                    
                                    if (hasAnyHamali) {
                                      return {
                                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                        position: 'relative' as const,
                                        transform: 'scale(1.1)',
                                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                                        border: '2px solid #10b981'
                                      };
                                    }
                                    
                                    return { 
                                      background: '#10b981', 
                                      position: 'relative' as const
                                    };
                                  })()}
                                >
                                  {(() => {
                                    if (selectedArrivalForHamali?.id === record.id) return '✕';
                                    
                                    const hasPaddyHamali = paddyHamaliEntries[record.id]?.length > 0;
                                    const hasOtherHamali = otherHamaliEntries[record.id]?.length > 0;
                                    const hasAnyHamali = hasPaddyHamali || hasOtherHamali;
                                    
                                    // Debug logging (remove in production)
                                    if (record.slNo === 'SL019523' || record.slNo === 'SL019626') {
                                      console.log(`🔍 Debug ${record.slNo}:`, {
                                        hamaliLoaded,
                                        hasPaddyHamali,
                                        hasOtherHamali,
                                        hasAnyHamali,
                                        paddyCount: paddyHamaliEntries[record.id]?.length || 0,
                                        otherCount: otherHamaliEntries[record.id]?.length || 0
                                      });
                                    }
                                    
                                    return hasAnyHamali ? 
                                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>✓</span> : 
                                      '💰';
                                  })()}
                                  
                                  {/* Show count badge if hamali entries exist */}
                                  {(() => {
                                    if (selectedArrivalForHamali?.id === record.id) return null;
                                    
                                    const paddyCount = paddyHamaliEntries[record.id]?.length || 0;
                                    const otherCount = otherHamaliEntries[record.id]?.length || 0;
                                    const totalCount = paddyCount + otherCount;
                                    
                                    if (totalCount > 0) {
                                      return (
                                        <span style={{
                                          position: 'absolute' as const,
                                          top: '-6px',
                                          right: '-6px',
                                          background: '#dc2626',
                                          color: 'white',
                                          borderRadius: '50%',
                                          minWidth: '20px',
                                          height: '20px',
                                          display: 'flex' as const,
                                          alignItems: 'center' as const,
                                          justifyContent: 'center' as const,
                                          fontSize: '11px',
                                          fontWeight: 'bold' as const,
                                          border: '2px solid white',
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                          padding: '0 2px'
                                        }}>
                                          {totalCount}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </IconButton>
                              )}
                            </ActionButtons>
                          </td>
                        </RowComponent>
                        {selectedArrivalForHamali?.id === record.id && (
                          <tr style={{ background: 'white' }}>
                            <td colSpan={17} style={{
                              padding: 0,
                              margin: 0,
                              border: 'none',
                              background: 'white'
                            }}>
                              <div style={{
                                width: '100%',
                                overflow: 'hidden',
                                background: 'white'
                              }}>
                                <InlinePaddyHamaliForm
                                  arrival={{
                                    id: selectedArrivalForHamali.id,
                                    arrivalNumber: selectedArrivalForHamali.slNo,
                                    partyName: selectedArrivalForHamali.broker || 'N/A',
                                    bags: selectedArrivalForHamali.bags
                                  }}
                                  onClose={() => setSelectedArrivalForHamali(null)}
                                  onSave={() => {
                                    // Refresh only hamali entries to show checkmark immediately
                                    if (hamaliLoaded) {
                                      const arrivalIds = hamaliRecords.map(r => r.id);
                                      fetchPaddyHamaliEntries(arrivalIds);
                                    }
                                    setSelectedArrivalForHamali(null);
                                    toast.success('✅ Hamali added successfully!');
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </ExcelTable>
            </TableContainer>
          </DateGroup>
        </RecordsContainer>
      )}
    </Container>
  );
};

export default Hamali;