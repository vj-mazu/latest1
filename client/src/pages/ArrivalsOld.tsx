import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from '../utils/toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  animation: fadeIn 0.5s ease-in;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: #ffffff;
  margin-bottom: 2rem;
  font-size: 2rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
`;

const FormCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border: 2px solid #f3f4f6;
`;

const TopSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 1rem;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
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

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const DatePickerWrapper = styled.div`
  .react-datepicker-wrapper {
    width: 100%;
  }

  .react-datepicker__input-container input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e5e7eb;
`;

const Button = styled.button`
  padding: 0.875rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }
  }

  &.secondary {
    background: #6b7280;
    color: white;

    &:hover:not(:disabled) {
      background: #4b5563;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SlNoDisplay = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 8px;
  text-align: center;
`;

const InfoText = styled.p`
  color: #6b7280;
  font-size: 0.85rem;
  margin-top: 0.25rem;
`;

const Arrivals: React.FC = () => {
  const { user } = useAuth();
  const { warehouses, kunchinittus, varieties, fetchWarehouses, fetchKunchinittus, fetchVarieties } = useLocation();

  // Form state
  const [slNo, setSlNo] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [dateInput, setDateInput] = useState('');
  const [movementType, setMovementType] = useState<'purchase' | 'shifting' | 'production-shifting'>('purchase');
  
  // Purchase fields
  const [broker, setBroker] = useState('');
  const [variety, setVariety] = useState(''); // Changed to text input
  const [bags, setBags] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toKunchinintuId, setToKunchinintuId] = useState(''); // To kunchinittu (chain linked)
  const [toWarehouseId, setToWarehouseId] = useState(''); // Warehouse (chain linked, filtered by kunchinittu)
  
  // Shifting fields
  const [fromKunchinintuId, setFromKunchinintuId] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseShiftId, setToWarehouseShiftId] = useState('');
  
  // Production shifting fields
  const [outturnId, setOutturnId] = useState('');
  const [outturns, setOutturns] = useState<any[]>([]);
  
  // Common fields
  const [moisture, setMoisture] = useState('');
  const [cutting, setCutting] = useState('');
  const [wbNo, setWbNo] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [tareWeight, setTareWeight] = useState('');
  const [lorryNumber, setLorryNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [loading, setLoading] = useState(false);
  const selectedToKunchinittu = useMemo(() => {
    if (!toKunchinintuId) {
      return undefined;
    }
    return kunchinittus.find(k => String(k.id) === toKunchinintuId);
  }, [kunchinittus, toKunchinintuId]);

  // Available warehouses for purchase (based on selected kunchinittu)
  const availableWarehouses = useMemo(() => {
    if (!selectedToKunchinittu) {
      return [];
    }

    if (selectedToKunchinittu.warehouse) {
      return [selectedToKunchinittu.warehouse];
    }

    if (selectedToKunchinittu.warehouseId) {
      const match = warehouses.find(w => w.id === selectedToKunchinittu.warehouseId);
      return match ? [match] : [];
    }

    return [];
  }, [selectedToKunchinittu, warehouses]);

  // Available warehouses for shifting (filtered by selected kunchinittu)
  const availableFromWarehouses = useMemo(() => {
    if (!fromKunchinintuId) {
      return warehouses;
    }
    const selectedKunchinittu = kunchinittus.find(k => String(k.id) === fromKunchinintuId);
    if (!selectedKunchinittu) return warehouses;
    return warehouses.filter(w => String(w.id) === String(selectedKunchinittu.warehouseId));
  }, [warehouses, kunchinittus, fromKunchinintuId]);

  const availableToWarehousesForShifting = useMemo(() => {
    if (!toKunchinintuId) {
      return warehouses;
    }
    const selectedKunchinittu = kunchinittus.find(k => String(k.id) === toKunchinintuId);
    if (!selectedKunchinittu) return warehouses;
    return warehouses.filter(w => String(w.id) === String(selectedKunchinittu.warehouseId));
  }, [warehouses, kunchinittus, toKunchinintuId]);

  useEffect(() => {
    if (!selectedToKunchinittu) {
      if (toWarehouseId !== '') {
        setToWarehouseId('');
      }
      return;
    }

    const suggestedId = selectedToKunchinittu.warehouse?.id || selectedToKunchinittu.warehouseId;
    if (suggestedId && toWarehouseId !== String(suggestedId)) {
      setToWarehouseId(String(suggestedId));
    }
  }, [selectedToKunchinittu, toWarehouseId]);

  // Fetch data on mount and auto-populate date
  useEffect(() => {
    // Auto-populate date with current date on component mount (at noon to avoid timezone issues)
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    setDate(today);
    setDateInput(today.toLocaleDateString('en-GB').split('/').join('-'));
    
    fetchNextSlNo();
    fetchWarehouses();
    fetchKunchinittus();
    fetchVarieties();
    fetchOutturns();
  }, []);

  const fetchNextSlNo = async () => {
    try {
      const response = await axios.get('/arrivals/next-sl-no');
      setSlNo((response.data as { slNo: string }).slNo);
    } catch (error) {
      console.error('Error fetching SL No:', error);
      toast.error('Failed to fetch SL number');
    }
  };

  const fetchOutturns = async () => {
    try {
      const response = await axios.get<any[]>('/outturns');
      setOutturns(response.data);
    } catch (error) {
      console.error('Error fetching outturns:', error);
    }
  };

  const netWeight = grossWeight && tareWeight ? 
    (parseFloat(grossWeight) - parseFloat(tareWeight)).toFixed(2) : '0.00';

  const handleReset = () => {
    setBroker('');
    setVariety('');
    setBags('');
    setFromLocation('');
    setToKunchinintuId('');
    setToWarehouseId('');
    setFromKunchinintuId('');
    setFromWarehouseId('');
    setToWarehouseShiftId('');
    setOutturnId('');
    setMoisture('');
    setCutting('');
    setWbNo('');
    setGrossWeight('');
    setTareWeight('');
    setLorryNumber('');
    setRemarks('');
    
    // Re-populate date with current date on form reset (at noon to avoid timezone issues)
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    setDate(today);
    setDateInput(today.toLocaleDateString('en-GB').split('/').join('-'));
    
    fetchNextSlNo();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!wbNo || !grossWeight || !tareWeight || !lorryNumber) {
      toast.error('Please fill all required fields');
      return;
    }

    if (parseFloat(grossWeight) <= parseFloat(tareWeight)) {
      toast.error('Gross weight must be greater than tare weight');
      return;
    }

    if (movementType === 'purchase') {
      if (!broker || !broker.trim() || !variety || !toKunchinintuId || !toWarehouseId) {
        toast.error('Please enter broker name, variety and select to location (kunchinittu & warehouse)');
        return;
      }
    } else if (movementType === 'shifting') {
      if (!fromKunchinintuId || !fromWarehouseId || !toKunchinintuId || !toWarehouseShiftId) {
        toast.error('Please fill all location fields for shifting');
        return;
      }
    } else if (movementType === 'production-shifting') {
      if (!fromKunchinintuId || !fromWarehouseId || !outturnId || !variety) {
        toast.error('Please fill all fields for production shifting');
        return;
      }
      
      // Validate variety matches outturn's allotted variety
      const selectedOutturn = outturns.find(o => o.id === parseInt(outturnId));
      if (selectedOutturn && selectedOutturn.allottedVariety !== variety) {
        toast.error(`This outturn is allotted to ${selectedOutturn.allottedVariety} variety only. Please select the correct variety.`);
        return;
      }
    }

    setLoading(true);

    try {
      const data = {
        date: date.toISOString().split('T')[0],
        movementType,
        broker: movementType === 'purchase' ? broker.trim() : null,
        variety: variety || null,
        bags: bags ? parseInt(bags) : null,
        fromLocation: movementType === 'purchase' ? fromLocation : null,
        toKunchinintuId: toKunchinintuId ? parseInt(toKunchinintuId) : null, // Used by both purchase and production-shifting
        toWarehouseId: movementType === 'purchase' ? (toWarehouseId ? parseInt(toWarehouseId) : null) : null,
        fromKunchinintuId: (movementType === 'shifting' || movementType === 'production-shifting') ? (fromKunchinintuId ? parseInt(fromKunchinintuId) : null) : null,
        fromWarehouseId: (movementType === 'shifting' || movementType === 'production-shifting') ? (fromWarehouseId ? parseInt(fromWarehouseId) : null) : null,
        toWarehouseShiftId: movementType === 'shifting' ? (toWarehouseShiftId ? parseInt(toWarehouseShiftId) : null) : null,
        outturnId: movementType === 'production-shifting' ? (outturnId ? parseInt(outturnId) : null) : null,
        moisture: moisture ? parseFloat(moisture) : null,
        cutting,
        wbNo,
        grossWeight: parseFloat(grossWeight),
        tareWeight: parseFloat(tareWeight),
        lorryNumber,
        remarks
      };

      await axios.post('/arrivals', data);
      
      const status = user?.role === 'staff' ? 'pending approval' : 'approved';
      toast.success(`Arrival created successfully (${status})!`);
      handleReset();
    } catch (error: any) {
      console.error('Error creating arrival:', error);
      
      // Enhanced error handling for variety validation
      const errorMessage = error.response?.data?.error || 'Failed to create arrival';
      
      if (errorMessage.includes('VARIETY MISMATCH') || errorMessage.includes('SOURCE VARIETY NOT FOUND') || errorMessage.includes('DESTINATION VARIETY MISMATCH')) {
        // Show detailed variety validation error with longer duration
        toast.error(errorMessage, {
          autoClose: 8000, // 8 seconds for important validation errors
          style: {
            fontSize: '14px',
            lineHeight: '1.4'
          }
        });
      } else {
        // Regular error handling
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>📝 Arrivals - Data Entry</Title>

      <FormCard>
        <form onSubmit={handleSubmit}>
          {/* Top Section - SL No and Date */}
          <TopSection>
            <FormGroup>
              <Label>SL No</Label>
              <SlNoDisplay>{slNo || 'Loading...'}</SlNoDisplay>
              <InfoText>Auto-generated serial number</InfoText>
            </FormGroup>

            <FormGroup>
              <Label>Date</Label>
              <Input
                type="text"
                value={dateInput}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^\d-]/g, ''); // Only numbers and hyphens
                  
                  // Remove extra hyphens
                  const parts = value.split('-');
                  if (parts.length > 3) {
                    value = parts.slice(0, 3).join('-');
                  }
                  
                  // Auto-format as DD-MM-YYYY
                  let formatted = value.replace(/-/g, ''); // Remove all hyphens first
                  if (formatted.length >= 2) {
                    formatted = formatted.slice(0, 2) + '-' + formatted.slice(2);
                  }
                  if (formatted.length >= 5) {
                    formatted = formatted.slice(0, 5) + '-' + formatted.slice(5);
                  }
                  if (formatted.length > 10) {
                    formatted = formatted.slice(0, 10);
                  }
                  
                  setDateInput(formatted);
                  
                  // Try to parse the date when complete
                  if (formatted.length === 10) {
                    const [day, month, year] = formatted.split('-').map(Number);
                    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
                      // Create date at noon to avoid timezone issues
                      const newDate = new Date(year, month - 1, day, 12, 0, 0);
                      if (!isNaN(newDate.getTime())) {
                        setDate(newDate);
                      }
                    }
                  }
                }}
                placeholder="DD-MM-YYYY"
                maxLength={10}
              />
              <InfoText>Format: DD-MM-YYYY (e.g., 27-10-2025)</InfoText>
            </FormGroup>
          </TopSection>

          {/* Movement Type */}
          <FormSection>
            <FormRow>
              <FormGroup>
                <Label>Movement Type *</Label>
                <Select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as 'purchase' | 'shifting' | 'production-shifting')}
                >
                  <option value="purchase">Purchase</option>
                  <option value="shifting">Shifting</option>
                  <option value="production-shifting">Production Shifting</option>
                </Select>
              </FormGroup>
            </FormRow>
          </FormSection>

          {/* Conditional Fields Based on Movement Type */}
          {movementType === 'purchase' ? (
            <>
              {/* Purchase Fields */}
              <FormSection>
                <SectionTitle>Purchase Details</SectionTitle>
                <FormRow>
                  <FormGroup>
                    <Label>Broker *</Label>
                    <Input
                      type="text"
                      value={broker}
                      onChange={(e) => setBroker(e.target.value.toUpperCase())}
                      placeholder="Enter broker name"
                      style={{ textTransform: 'uppercase' }}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Variety *</Label>
                    <Input
                      type="text"
                      value={variety}
                      onChange={(e) => setVariety(e.target.value.toUpperCase())}
                      required
                      placeholder="Enter variety name"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Bags</Label>
                    <Input
                      type="number"
                      value={bags}
                      onChange={(e) => setBags(e.target.value)}
                      placeholder="Number of bags"
                      min="0"
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <Label>From</Label>
                    <Input
                      type="text"
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value.toUpperCase())}
                      placeholder="Source location"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>To *</Label>
                    <Select
                      value={toKunchinintuId}
                      onChange={(e) => {
                        setToKunchinintuId(e.target.value);
                        setToWarehouseId(''); // Reset warehouse when kunchinittu changes
                      }}
                      required
                    >
                      <option value="">Select Kunchinittu</option>
                      {kunchinittus.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Warehouse *</Label>
                    <Select
                      value={toWarehouseId}
                      onChange={(e) => setToWarehouseId(e.target.value)}
                      required
                      disabled={!toKunchinintuId}
                    >
                      <option value="">Select Warehouse</option>
                      {availableWarehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Moisture (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={moisture}
                      onChange={(e) => setMoisture(e.target.value)}
                      placeholder="e.g., 12.5"
                      min="0"
                      max="100"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Cutting</Label>
                    <Input
                      type="text"
                      value={cutting}
                      onChange={(e) => setCutting(e.target.value.toUpperCase())}
                      placeholder="e.g., 3X2, 5X1"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </FormGroup>
                </FormRow>
              </FormSection>
            </>
          ) : movementType === 'shifting' ? (
            <>
              {/* Shifting Fields */}
              <FormSection>
                <SectionTitle>Shifting Details</SectionTitle>
                <FormRow>
                  <FormGroup>
                    <Label>Variety</Label>
                    <Input
                      type="text"
                      value={variety}
                      onChange={(e) => setVariety(e.target.value.toUpperCase())}
                      placeholder="Enter variety name"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Bags</Label>
                    <Input
                      type="number"
                      value={bags}
                      onChange={(e) => setBags(e.target.value)}
                      placeholder="Number of bags"
                      min="0"
                    />
                  </FormGroup>
                </FormRow>

                <SectionTitle>From Location</SectionTitle>
                <FormRow>
                  <FormGroup>
                    <Label>From Kunchinittu *</Label>
                    <Select
                      value={fromKunchinintuId}
                      onChange={(e) => {
                        setFromKunchinintuId(e.target.value);
                        setFromWarehouseId(''); // Reset warehouse when kunchinittu changes
                      }}
                      required
                    >
                      <option value="">Select Kunchinittu First</option>
                      {kunchinittus.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name} ({k.code})
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>From Warehouse *</Label>
                    <Select
                      value={fromWarehouseId}
                      onChange={(e) => setFromWarehouseId(e.target.value)}
                      required
                      disabled={!fromKunchinintuId}
                    >
                      <option value="">
                        {fromKunchinintuId ? 'Select Warehouse' : 'Select Kunchinittu First'}
                      </option>
                      {availableFromWarehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                </FormRow>

                <SectionTitle>To Location</SectionTitle>
                <FormRow>
                  <FormGroup>
                    <Label>To Kunchinittu *</Label>
                    <Select
                      value={toKunchinintuId}
                      onChange={(e) => {
                        setToKunchinintuId(e.target.value);
                        setToWarehouseShiftId(''); // Reset warehouse when kunchinittu changes
                      }}
                      required
                    >
                      <option value="">Select Kunchinittu First</option>
                      {kunchinittus.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name} ({k.code})
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>To Warehouse *</Label>
                    <Select
                      value={toWarehouseShiftId}
                      onChange={(e) => setToWarehouseShiftId(e.target.value)}
                      required
                      disabled={!toKunchinintuId}
                    >
                      <option value="">
                        {toKunchinintuId ? 'Select Warehouse' : 'Select Kunchinittu First'}
                      </option>
                      {availableToWarehousesForShifting.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <Label>Moisture (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={moisture}
                      onChange={(e) => setMoisture(e.target.value)}
                      placeholder="e.g., 12.5"
                      min="0"
                      max="100"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Cutting</Label>
                    <Input
                      type="text"
                      value={cutting}
                      onChange={(e) => setCutting(e.target.value)}
                      placeholder="e.g., 3x2, 5x1"
                    />
                  </FormGroup>
                </FormRow>
              </FormSection>
            </>
          ) : (
            <>
              {/* Production Shifting Fields */}
              <FormSection>
                <SectionTitle>Production Shifting Details</SectionTitle>
                <FormRow>
                  <FormGroup>
                    <Label>Variety *</Label>
                    <Input
                      type="text"
                      value={variety}
                      onChange={(e) => setVariety(e.target.value.toUpperCase())}
                      placeholder="Enter variety name"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Bags</Label>
                    <Input
                      type="number"
                      value={bags}
                      onChange={(e) => setBags(e.target.value)}
                      placeholder="Number of bags"
                      min="0"
                    />
                  </FormGroup>
                </FormRow>

                <SectionTitle>From Location</SectionTitle>
                <FormRow>
                  <FormGroup>
                    <Label>From Kunchinittu *</Label>
                    <Select
                      value={fromKunchinintuId}
                      onChange={(e) => {
                        setFromKunchinintuId(e.target.value);
                        setFromWarehouseId(''); // Reset warehouse when kunchinittu changes
                        // Auto-set the matching kunchinittu as destination
                        setToKunchinintuId(e.target.value);
                      }}
                      required
                    >
                      <option value="">Select Kunchinittu First</option>
                      {kunchinittus.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name} ({k.code})
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>From Warehouse *</Label>
                    <Select
                      value={fromWarehouseId}
                      onChange={(e) => setFromWarehouseId(e.target.value)}
                      required
                      disabled={!fromKunchinintuId}
                    >
                      <option value="">
                        {fromKunchinintuId ? 'Select Warehouse' : 'Select Kunchinittu First'}
                      </option>
                      {availableFromWarehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                </FormRow>

                <SectionTitle>To Outturn</SectionTitle>
                <FormRow>
                  <FormGroup>
                    <Label>Outturn Number *</Label>
                    <Select
                      value={outturnId}
                      onChange={(e) => {
                        setOutturnId(e.target.value);
                        // Auto-fill variety based on outturn's allotted variety
                        const selected = outturns.find(o => o.id === parseInt(e.target.value));
                        if (selected) {
                          setVariety(selected.allottedVariety);
                        }
                      }}
                      required
                    >
                      <option value="">Select Outturn</option>
                      {outturns.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.code} - {o.allottedVariety}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <Label>Moisture (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={moisture}
                      onChange={(e) => setMoisture(e.target.value)}
                      placeholder="e.g., 12.5"
                      min="0"
                      max="100"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Cutting</Label>
                    <Input
                      type="text"
                      value={cutting}
                      onChange={(e) => setCutting(e.target.value.toUpperCase())}
                      placeholder="e.g., 3X2, 5X1"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </FormGroup>
                </FormRow>
              </FormSection>
            </>
          )}

          {/* Common Measurement Fields */}
          <FormSection>
            <SectionTitle>Measurements</SectionTitle>
            <FormRow>
              <FormGroup>
                <Label>WB No *</Label>
                <Input
                  type="text"
                  value={wbNo}
                  onChange={(e) => setWbNo(e.target.value.toUpperCase())}
                  placeholder="Weighbridge number"
                  required
                  style={{ textTransform: 'uppercase' }}
                />
              </FormGroup>

              <FormGroup>
                <Label>Gross Weight (kg) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value)}
                  placeholder="0.00"
                  required
                  min="0"
                />
              </FormGroup>

              <FormGroup>
                <Label>Tare Weight (kg) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tareWeight}
                  onChange={(e) => setTareWeight(e.target.value)}
                  placeholder="0.00"
                  required
                  min="0"
                />
              </FormGroup>

              <FormGroup>
                <Label>Net Weight (kg)</Label>
                <Input
                  type="text"
                  value={netWeight}
                  disabled
                  style={{ 
                    background: '#f3f4f6', 
                    fontWeight: 'bold',
                    color: '#059669'
                  }}
                />
                <InfoText>Auto-calculated (Gross - Tare)</InfoText>
              </FormGroup>

              <FormGroup>
                <Label>Lorry Number *</Label>
                <Input
                  type="text"
                  value={lorryNumber}
                  onChange={(e) => setLorryNumber(e.target.value.toUpperCase())}
                  placeholder="Vehicle registration"
                  required
                  style={{ textTransform: 'uppercase' }}
                />
              </FormGroup>
            </FormRow>
          </FormSection>

          {/* Remarks */}
          <FormSection>
            <FormGroup>
              <Label>Remarks</Label>
              <Input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes"
              />
            </FormGroup>
          </FormSection>

          {/* Action Buttons */}
          <ButtonGroup>
            <Button type="button" className="secondary" onClick={handleReset}>
              Reset Form
            </Button>
            <Button type="submit" className="primary" disabled={loading}>
              {loading ? 'Saving...' : `Save ${movementType === 'purchase' ? 'Purchase' : 'Shifting'}`}
            </Button>
          </ButtonGroup>

          {user?.role === 'staff' && (
            <InfoText style={{ textAlign: 'center', marginTop: '1rem' }}>
              ℹ️ Your entries will be pending until approved by Manager/Admin
            </InfoText>
          )}
        </form>
      </FormCard>
    </Container>
  );
};

export default Arrivals;