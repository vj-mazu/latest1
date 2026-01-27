import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f97316;
  min-height: 100vh;
`;

const BookCard = styled.div`
  background: white;
  border-radius: 0;
  padding: 2rem;
  box-shadow: none;
  border: 3px solid #000;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid #000;
  padding-bottom: 1rem;
`;

const Title = styled.h1`
  color: #000;
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
`;

const DateDisplay = styled.div`
  color: #000;
  font-size: 1.2rem;
  font-weight: bold;
`;

const FilterSection = styled.div`
  background: white;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const DateInput = styled.input`
  padding: 0.5rem;
  border: 2px solid #000;
  font-size: 1rem;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  border: 2px solid #000;
  background: ${props => props.active ? '#000' : 'white'};
  color: ${props => props.active ? 'white' : '#000'};
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.active ? '#000' : '#f3f4f6'};
  }
`;

const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  color: #000;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
`;

const EntryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const Amount = styled.div`
  font-weight: bold;
  color: #000;
  font-size: 1rem;
  min-width: 80px;
  text-align: left;
`;

const Details = styled.div`
  color: #000;
  font-size: 1rem;
  flex: 1;
  margin-left: 2rem;
`;

const SplitsInfo = styled.div`
  font-size: 0.8rem;
  color: #444;
  margin-left: 0.5rem;
  min-width: 280px;
  text-align: right;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  line-height: 1.4;
  white-space: pre-line;
`;

const SplitItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const WorkerName = styled.span`
  font-weight: 600;
  color: #495057;
  font-size: 0.75rem;
`;

const WorkerDetails = styled.span`
  color: #6c757d;
  font-size: 0.75rem;
  text-align: right;
`;



const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-top: 2px solid #000;
  margin-top: 1rem;
  font-weight: bold;
  font-size: 1.1rem;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

interface HamaliSummary {
  loadingEntries?: any[];
  unloadingEntries?: any[];
  looseEntries?: any[];
  cuttingEntries?: any[];
  plottingEntries?: any[];
  shiftingEntries?: any[];
  fillingEntries?: any[];
  otherHamaliEntries?: { [key: string]: any };
  grandTotal: number;
  totalEntries: number;
}

const HamaliBookSimple: React.FC = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [activeTab, setActiveTab] = useState<'paddy' | 'rice'>('paddy');
  const [summary, setSummary] = useState<HamaliSummary | null>(null);
  const [riceHamaliSummary, setRiceHamaliSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (activeTab === 'paddy') {
      fetchSummary();
    } else {
      fetchRiceHamaliSummary();
    }
  }, [selectedDate, activeTab]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dateStr = selectedDate;

      // Fetch both paddy hamali and other hamali summaries with individual error handling
      let paddySummary: any = {};
      let otherSummary: any = {};

      // Fetch paddy hamali summary
      try {
        const paddyResponse = await axios.get<{ summary: any }>(`/paddy-hamali-entries/summary/${dateStr}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        paddySummary = paddyResponse.data.summary || {};
      } catch (paddyError) {
        console.error('Error fetching paddy hamali summary:', paddyError);
        // Don't show error toast for paddy hamali, just log it
      }

      // Fetch other hamali summary
      try {
        const otherResponse = await axios.get<{ summary: any }>(`/other-hamali-entries/summary/${dateStr}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        otherSummary = otherResponse.data.summary || {};
      } catch (otherError) {
        console.error('Error fetching other hamali summary:', otherError);
        // Don't show error toast for other hamali, just log it
      }

      // Combine summaries
      const combinedSummary: HamaliSummary = {
        ...paddySummary,
        otherHamaliEntries: otherSummary.otherHamaliEntries || {},
        grandTotal: (paddySummary.grandTotal || 0) + (otherSummary.grandTotal || 0),
        totalEntries: (paddySummary.totalEntries || 0) + (otherSummary.totalEntries || 0)
      };

      setSummary(combinedSummary);
    } catch (error) {
      console.error('Error fetching hamali summary:', error);
      toast.error('Failed to fetch hamali summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchRiceHamaliSummary = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dateStr = selectedDate;

      // Use hamali-book API (same as paddy hamali pattern)
      const response = await axios.get('/hamali-book', { 
        params: { 
          dateFrom: dateStr, 
          dateTo: dateStr
        },
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });

      console.log('🍚 Rice hamali API response:', response.data);

      if ((response.data as any).success && (response.data as any).data) {
        const { riceHamali, otherHamali, summary } = (response.data as any).data;
        
        console.log('🍚 Rice hamali data structure:', {
          riceHamaliType: typeof riceHamali,
          riceHamaliKeys: riceHamali ? Object.keys(riceHamali) : 'null',
          allEntriesCount: riceHamali?.all?.length || 0,
          mainEntriesCount: riceHamali?.main?.length || 0,
          otherEntriesCount: riceHamali?.other?.length || 0,
          otherHamaliCount: otherHamali?.length || 0
        });
        
        // FIXED: Handle both array and object formats for backward compatibility
        let riceEntries = [];
        if (Array.isArray(riceHamali)) {
          // New format: riceHamali is directly an array
          riceEntries = riceHamali;
        } else if (riceHamali && riceHamali.all) {
          // Old format: riceHamali is an object with .all property
          riceEntries = riceHamali.all;
        } else if (riceHamali) {
          // Fallback: treat as array if it exists
          riceEntries = Array.isArray(riceHamali) ? riceHamali : [];
        }
        
        const otherEntries = otherHamali || [];
        
        console.log('🍚 Processing entries:', {
          riceEntriesCount: riceEntries.length,
          otherEntriesCount: otherEntries.length
        });
        
        // Simple grouping by work type (like paddy hamali)
        const groupedRiceEntries: any = {};
        riceEntries.forEach((entry: any) => {
          const workType = entry.worktype || 'Rice Work';
          if (!groupedRiceEntries[workType]) {
            groupedRiceEntries[workType] = [];
          }
          groupedRiceEntries[workType].push({
            id: entry.id,
            bags: entry.bags,
            totalAmount: parseFloat(entry.totalamount || '0'),
            workDetail: entry.workdetail,
            workerName: entry.workername || 'Worker',
            batchNumber: entry.batchnumber || 1,
            // Additional fields for rice hamali display
            variety: entry.variety || entry.worktype, // Use variety or work type
            location: entry.location || entry.movement_type || 'Production',
            billNumber: entry.bill_number,
            lorryNumber: entry.lorry_number,
            productType: entry.product_type
          });
        });

        // FIXED: Filter other hamali entries for RICE-related only
        // Only show other hamali entries that are rice-related (not paddy-related)
        const riceRelatedOtherEntries = otherEntries.filter((entry: any) => {
          const workType = (entry.workname || entry.work_type || '').toLowerCase();
          const workDetail = (entry.work_detail || '').toLowerCase();
          
          // Include entries that are rice-related or production-related
          return workType.includes('rice') || 
                 workType.includes('production') || 
                 workType.includes('loading') && !workType.includes('paddy') ||
                 workType.includes('unloading') && !workType.includes('paddy') ||
                 workDetail.includes('rice') ||
                 workDetail.includes('production') ||
                 entry.rice_production_id != null; // Has rice production ID
        });

        // Simple grouping for rice-related other hamali only
        const groupedOtherEntries: any = {};
        riceRelatedOtherEntries.forEach((entry: any) => {
          const workName = entry.workname || entry.work_type || 'Other Rice Work';
          if (!groupedOtherEntries[workName]) {
            groupedOtherEntries[workName] = [];
          }
          groupedOtherEntries[workName].push({
            id: entry.id,
            bags: entry.quantity || entry.bags,
            totalAmount: parseFloat(entry.totalamount || entry.amount || '0'),
            workDetail: entry.work_detail,
            workerName: entry.workername || entry.worker_name || 'Worker'
          });
        });

        // Calculate totals for rice hamali only (excluding paddy-related other hamali)
        const riceHamaliTotal = riceEntries.reduce((sum: number, entry: any) => sum + parseFloat(entry.totalamount || '0'), 0);
        const riceOtherTotal = riceRelatedOtherEntries.reduce((sum: number, entry: any) => sum + parseFloat(entry.totalamount || entry.amount || '0'), 0);

        // Simple summary (like paddy hamali)
        const riceHamaliSummary = {
          riceHamaliEntries: groupedRiceEntries,
          otherHamaliEntries: groupedOtherEntries,
          grandTotal: riceHamaliTotal + riceOtherTotal,
          totalEntries: riceEntries.length + riceRelatedOtherEntries.length
        };

        console.log('🍚 Final rice hamali summary:', {
          riceHamaliEntries: Object.keys(groupedRiceEntries).length,
          otherHamaliEntries: Object.keys(groupedOtherEntries).length,
          riceHamaliTotal: riceHamaliTotal.toFixed(2),
          riceOtherTotal: riceOtherTotal.toFixed(2),
          grandTotal: riceHamaliSummary.grandTotal.toFixed(2),
          totalEntries: riceHamaliSummary.totalEntries
        });

        setRiceHamaliSummary(riceHamaliSummary);
      } else {
        console.log('⚠️ No rice hamali data in response');
        // Empty state (like paddy hamali)
        setRiceHamaliSummary({
          riceHamaliEntries: {},
          otherHamaliEntries: {},
          grandTotal: 0,
          totalEntries: 0
        });
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching rice hamali summary:', error);
      console.error('❌ Error response:', error.response?.data);
      // Don't show error toast, just log (like paddy hamali)
      setRiceHamaliSummary({
        riceHamaliEntries: {},
        otherHamaliEntries: {},
        grandTotal: 0,
        totalEntries: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  };

  const formatLocationDisplay = (arrival: any) => {
    if (!arrival) return 'Unknown Location';
    
    const movementType = arrival.movementType;
    const broker = arrival.broker || 'Unknown Broker';
    
    if (movementType === 'purchase') {
      // Check if it's purchase to outturn (has outturn assigned)
      if (arrival.outturn && arrival.outturn.code) {
        return `${arrival.bags || 0} Bags from ${broker} to Outturn ${arrival.outturn.code}`;
      } else {
        // Regular purchase to kunchinittu warehouse
        const kunchinittu = arrival.toKunchinittu?.name || arrival.toKunchinittu?.code || 'Unknown KN';
        const warehouse = arrival.toWarehouse?.name || arrival.toWarehouse?.code || 'Unknown Warehouse';
        return `${arrival.bags || 0} Bags from ${broker} to ${kunchinittu} ${warehouse}`;
      }
    } else if (movementType === 'shifting') {
      // Shifting: bags from kunchinittu warehouse to kunchinittu warehouse
      const fromKN = arrival.fromKunchinittu?.name || arrival.fromKunchinittu?.code || 'Unknown KN';
      const fromWH = arrival.fromWarehouse?.name || arrival.fromWarehouse?.code || 'Unknown Warehouse';
      const toKN = arrival.toKunchinittu?.name || arrival.toKunchinittu?.code || 'Unknown KN';
      const toWH = arrival.toWarehouseShift?.name || arrival.toWarehouseShift?.code || arrival.toWarehouse?.name || 'Unknown Warehouse';
      return `${arrival.bags || 0} Bags from ${fromKN} ${fromWH} to ${toKN} ${toWH}`;
    } else if (movementType === 'production-shifting' || movementType === 'production') {
      // Production shifting: bags from kunchinittu warehouse to outturn number
      const fromKN = arrival.fromKunchinittu?.name || arrival.fromKunchinittu?.code || 'Unknown KN';
      const fromWH = arrival.fromWarehouse?.name || arrival.fromWarehouse?.code || 'Unknown Warehouse';
      const outturn = arrival.outturn?.code || 'Unknown Outturn';
      return `${arrival.bags || 0} Bags from ${fromKN} ${fromWH} to Outturn ${outturn}`;
    }
    
    // Fallback for unknown movement types
    return `${arrival.bags || 0} Bags from ${broker} to ${arrival.toKunchinittu?.name || 'Unknown Location'}`;
  };

  const renderSplitsInfo = (splits: any[]) => {
    if (!splits || splits.length === 0) return null;
    
    // Group splits by worker name (sum both bags and amounts, calculate rate)
    const groupedSplits = splits.reduce((acc, split) => {
      const key = split.workerName;
      if (!acc[key]) {
        acc[key] = { bags: 0, amount: 0, rate: 0 };
      }
      acc[key].bags += split.bags;
      acc[key].amount += parseFloat(split.amount || 0);
      // Calculate rate from the split data
      const splitRate = split.rate || split.ratePerBag || split.rateperbag || 
                       (split.amount && split.bags ? parseFloat(split.amount) / split.bags : 0);
      acc[key].rate = splitRate; // Use the rate from split (should be same for all splits of same work)
      return acc;
    }, {});
    
    const splitEntries = Object.entries(groupedSplits);
    
    return (
      <div>
        {splitEntries.map(([worker, data]: [string, any], index) => {
          const rate = data.rate || (data.amount && data.bags ? data.amount / data.bags : 0);
          return (
            <SplitItem key={index}>
              <WorkerName>{worker}:</WorkerName>
              <WorkerDetails>
                🎯 {data.bags} bags × ₹{parseFloat(rate.toString()).toFixed(2)} = ₹{data.amount.toFixed(0)} 🎯
              </WorkerDetails>
            </SplitItem>
          );
        })}
      </div>
    );
  };

  // Keep the old function for PDF generation
  const formatSplitsInfo = (splits: any[]) => {
    if (!splits || splits.length === 0) return '';
    
    // Group splits by worker name (sum both bags and amounts, calculate rate)
    const groupedSplits = splits.reduce((acc, split) => {
      const key = split.workerName;
      if (!acc[key]) {
        acc[key] = { bags: 0, amount: 0, rate: 0 };
      }
      acc[key].bags += split.bags;
      acc[key].amount += parseFloat(split.amount || 0);
      // Calculate rate from the split data
      const splitRate = split.rate || split.ratePerBag || split.rateperbag || 
                       (split.amount && split.bags ? parseFloat(split.amount) / split.bags : 0);
      acc[key].rate = splitRate;
      return acc;
    }, {});
    
    return Object.entries(groupedSplits)
      .map(([worker, data]: [string, any]) => {
        const rate = data.rate || (data.amount && data.bags ? data.amount / data.bags : 0);
        return `${worker}: ${data.bags} bags × ₹${parseFloat(rate.toString()).toFixed(2)} = ₹${data.amount.toFixed(0)}`;
      })
      .join(', ');
  };



  const handleDownloadPDF = () => {
    // Create a blob with HTML content for PDF generation
    const htmlContent = generatePDFContent();
    
    // Create a temporary link element for download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hamali-book-${selectedDate}.html`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Also trigger print for immediate PDF generation
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Auto-print after content loads
      setTimeout(() => {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);
    }
  };

  const generatePDFContent = () => {
    const printStyles = `
      <style>
        @media print {
          @page {
            size: A4 portrait;
            margin: 20mm;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white !important;
          }
          
          .print-container {
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          
          .print-title {
            font-size: 18px;
            font-weight: bold;
            margin: 0;
          }
          
          .print-date {
            font-size: 14px;
            margin: 5px 0 0 0;
          }
          
          .print-section {
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          
          .print-section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
          }
          
          .print-entry {
            display: table;
            width: 100%;
            padding: 4px 0;
            border-bottom: 1px solid #ddd;
            font-size: 11px;
            page-break-inside: avoid;
          }
          
          .print-entry > div {
            display: table-cell;
            vertical-align: top;
            padding: 2px 5px;
          }
          
          .print-amount {
            font-weight: bold;
            width: 80px;
            text-align: left;
          }
          
          .print-details {
            width: auto;
            padding-left: 10px;
            padding-right: 10px;
          }
          
          .print-splits {
            width: 200px;
            text-align: right;
            font-size: 10px;
            color: #666;
          }
          
          .print-total {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #000;
            font-size: 14px;
            font-weight: bold;
            display: table;
            width: 100%;
          }
          
          .print-total > div {
            display: table-cell;
            vertical-align: top;
            padding: 2px 5px;
          }
        }
        
        @media screen {
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
            margin: 20px;
          }
        }
      </style>
    `;
    
    // Create print content
    let contentHTML = `
      <div class="print-container">
        <div class="print-header">
          <h1 class="print-title">Hamali Book Summary</h1>
          <div class="print-date">${formatDate(selectedDate)}</div>
        </div>
    `;
    
    if (summary) {
      // Add paddy hamali sections
      const paddySections = [
        { entries: summary.loadingEntries, title: 'Paddy Loading' },
        { entries: summary.unloadingEntries, title: 'Paddy Unloading' },
        { entries: summary.looseEntries, title: 'Loose Tumbiddu' },
        { entries: summary.cuttingEntries, title: 'Paddy Cutting' },
        { entries: summary.plottingEntries, title: 'Plotting' },
        { entries: summary.shiftingEntries, title: 'Paddy Shifting' },
        { entries: summary.fillingEntries, title: 'Paddy Filling with Stitching' }
      ];
      
      paddySections.forEach(({ entries, title }) => {
        if (entries && entries.length > 0) {
          contentHTML += `
            <div class="print-section">
              <div class="print-section-title">${title}:</div>
          `;
          
          entries.forEach((entry: any) => {
            contentHTML += `
              <div class="print-entry">
                <div class="print-amount">₹${entry.totalAmount.toFixed(0)}</div>
                <div class="print-details">${entry.totalBags} Bags from ${formatLocationDisplay(entry.arrival)}</div>
                <div class="print-splits">${formatSplitsInfo(entry.splits)}</div>
              </div>
            `;
          });
          
          contentHTML += `</div>`;
        }
      });
      
      // Add other hamali works
      if (summary.otherHamaliEntries && Object.keys(summary.otherHamaliEntries).length > 0) {
        contentHTML += `
          <div class="print-section">
            <div class="print-section-title">Other Hamali Works:</div>
        `;
        
        Object.entries(summary.otherHamaliEntries).forEach(([key, entry]: [string, any]) => {
          const description = entry.description ? ` - ${entry.description}` : '';
          contentHTML += `
            <div class="print-entry">
              <div class="print-amount">₹${entry.totalAmount.toFixed(0)}</div>
              <div class="print-details">${entry.totalBags} Bags - ${entry.workType} (${entry.workDetail})${description}</div>
              <div class="print-splits">${formatSplitsInfo(entry.splits)}</div>
            </div>
          `;
        });
        
        contentHTML += `</div>`;
      }
      
      // Add total
      contentHTML += `
        <div class="print-total">
          <div class="print-amount">₹${summary.grandTotal.toFixed(0)}</div>
          <div class="print-details">Total</div>
          <div class="print-splits"></div>
        </div>
      `;
    }
    
    contentHTML += `</div>`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hamali Book Summary - ${formatDate(selectedDate)}</title>
        <meta charset="UTF-8">
        ${printStyles}
      </head>
      <body>
        ${contentHTML}
      </body>
      </html>
    `;
  };

  const renderPaddySection = (entries: any[], title: string) => {
    if (!entries || entries.length === 0) return null;

    return (
      <Section>
        <SectionTitle>{title}:</SectionTitle>
        {entries.map((entry: any, index: number) => (
          <EntryRow key={index}>
            <Amount>₹{entry.totalAmount.toFixed(0)}</Amount>
            <Details>
              {entry.totalBags} Bags from {formatLocationDisplay(entry.arrival)}
            </Details>
            <SplitsInfo>
              {renderSplitsInfo(entry.splits)}
            </SplitsInfo>
          </EntryRow>
        ))}
      </Section>
    );
  };

  const renderRiceSection = (entries: any[], title: string) => {
    if (!entries || entries.length === 0) return null;

    return (
      <Section>
        <SectionTitle>{title}:</SectionTitle>
        {entries.map((entry: any, index: number) => (
          <EntryRow key={index}>
            <Amount>₹{entry.totalAmount.toFixed(0)}</Amount>
            <Details>
              {entry.bags} Bags - {entry.workDetail}
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                Variety: {entry.variety} | Location: {entry.location}
                {entry.billNumber && ` | Bill: ${entry.billNumber}`}
                {entry.lorryNumber && ` | Lorry: ${entry.lorryNumber}`}
                {entry.productType && ` | Type: ${entry.productType}`}
              </div>
            </Details>
            <SplitsInfo>
              <div>
                <SplitItem>
                  <WorkerName>{entry.workerName}:</WorkerName>
                  <WorkerDetails>
                    🎯 {entry.bags} bags × ₹{(entry.ratePerBag || entry.rateperbag || (entry.totalAmount / entry.bags) || 0).toFixed(2)} = ₹{entry.totalAmount.toFixed(0)} 🎯
                  </WorkerDetails>
                </SplitItem>
              </div>
            </SplitsInfo>
          </EntryRow>
        ))}
      </Section>
    );
  };

  const calculateBatchTotals = (summary: HamaliSummary) => {
    const batchTotals: { [key: string]: number } = {};
    
    // Helper function to process entries and accumulate batch totals
    const processSectionEntries = (entries: any[]) => {
      entries.forEach((entry: any) => {
        if (entry.splits && entry.splits.length > 0) {
          entry.splits.forEach((split: any) => {
            // Extract batch number from worker name (e.g., "Batch 1" -> 1, "Batch 2" -> 2)
            let batchNumber = split.batchNumber;
            if (split.workerName && split.workerName.includes('Batch')) {
              const match = split.workerName.match(/Batch\s*(\d+)/i);
              if (match) {
                batchNumber = parseInt(match[1]);
              }
            }
            
            const batchKey = `Batch ${batchNumber || 1}`;
            const amount = parseFloat(split.amount || 0);
            batchTotals[batchKey] = (batchTotals[batchKey] || 0) + amount;
          });
        }
      });
    };
    
    // Process all paddy hamali sections
    if (summary.loadingEntries) processSectionEntries(summary.loadingEntries);
    if (summary.unloadingEntries) processSectionEntries(summary.unloadingEntries);
    if (summary.looseEntries) processSectionEntries(summary.looseEntries);
    if (summary.cuttingEntries) processSectionEntries(summary.cuttingEntries);
    if (summary.plottingEntries) processSectionEntries(summary.plottingEntries);
    if (summary.shiftingEntries) processSectionEntries(summary.shiftingEntries);
    if (summary.fillingEntries) processSectionEntries(summary.fillingEntries);
    
    // Process other hamali entries
    if (summary.otherHamaliEntries) {
      Object.values(summary.otherHamaliEntries).forEach((entry: any) => {
        if (entry.splits && entry.splits.length > 0) {
          entry.splits.forEach((split: any) => {
            // Extract batch number from worker name
            let batchNumber = split.batchNumber;
            if (split.workerName && split.workerName.includes('Batch')) {
              const match = split.workerName.match(/Batch\s*(\d+)/i);
              if (match) {
                batchNumber = parseInt(match[1]);
              }
            }
            
            const batchKey = `Batch ${batchNumber || 1}`;
            const amount = parseFloat(split.amount || 0);
            batchTotals[batchKey] = (batchTotals[batchKey] || 0) + amount;
          });
        } else {
          // For entries without splits, assume Batch 1
          const batchKey = 'Batch 1';
          const amount = parseFloat(entry.totalAmount || 0);
          batchTotals[batchKey] = (batchTotals[batchKey] || 0) + amount;
        }
      });
    }
    
    return batchTotals;
  };

  const calculateRiceBatchTotals = (riceHamaliSummary: any) => {
    const batchTotals: { [key: string]: number } = {};
    
    // Process rice hamali entries
    if (riceHamaliSummary.riceHamaliEntries) {
      Object.values(riceHamaliSummary.riceHamaliEntries).forEach((entries: any) => {
        entries.forEach((entry: any) => {
          // For rice hamali, assume single worker entries, use Batch 1 as default
          const batchKey = `Batch ${entry.batchNumber || 1}`;
          const amount = parseFloat(entry.totalAmount || 0);
          batchTotals[batchKey] = (batchTotals[batchKey] || 0) + amount;
        });
      });
    }
    
    // Process other hamali entries
    if (riceHamaliSummary.otherHamaliEntries) {
      Object.values(riceHamaliSummary.otherHamaliEntries).forEach((entries: any) => {
        entries.forEach((entry: any) => {
          const batchKey = `Batch ${entry.batchNumber || 1}`;
          const amount = parseFloat(entry.totalAmount || 0);
          batchTotals[batchKey] = (batchTotals[batchKey] || 0) + amount;
        });
      });
    }
    
    return batchTotals;
  };

  const renderBatchTotals = (batchTotals: { [key: string]: number }) => {
    const batchEntries = Object.entries(batchTotals);
    if (batchEntries.length === 0) return null;
    
    return (
      <div style={{ 
        fontSize: '0.875rem', 
        color: '#666',
        marginTop: '0.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {batchEntries.map(([batch, total], index) => (
          <span key={batch} style={{ 
            background: '#f3f4f6',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontWeight: '600'
          }}>
            {batch}: ₹{(total as number).toFixed(0)}
          </span>
        ))}
        <span style={{ 
          background: '#e5e7eb',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontWeight: 'bold',
          color: '#374151'
        }}>
          Total: ₹{batchEntries.reduce((sum, [, total]) => sum + (total as number), 0).toFixed(0)}
        </span>
      </div>
    );
  };

  const renderOtherHamaliSection = () => {
    if (!summary?.otherHamaliEntries || Object.keys(summary.otherHamaliEntries).length === 0) {
      return null;
    }

    return (
      <Section>
        <SectionTitle>Other Hamali Works:</SectionTitle>
        {Object.entries(summary.otherHamaliEntries).map(([entryKey, entry]: [string, any]) => (
          <EntryRow key={entryKey}>
            <Amount>₹{entry.totalAmount.toFixed(0)}</Amount>
            <Details>
              {entry.totalBags} Bags - {entry.workType} ({entry.workDetail})
              {entry.description && ` - ${entry.description}`}
            </Details>
            <SplitsInfo>
              {renderSplitsInfo(entry.splits)}
            </SplitsInfo>
          </EntryRow>
        ))}
      </Section>
    );
  };

  const renderRiceOtherHamaliSection = () => {
    if (!riceHamaliSummary?.otherHamaliEntries || Object.keys(riceHamaliSummary.otherHamaliEntries).length === 0) {
      return null;
    }

    return (
      <Section>
        <SectionTitle>Other Hamali Works:</SectionTitle>
        {Object.entries(riceHamaliSummary.otherHamaliEntries).map(([workType, entries]: [string, any]) => 
          entries.map((entry: any, index: number) => (
            <EntryRow key={`${workType}-${index}`}>
              <Amount>₹{entry.totalAmount.toFixed(0)}</Amount>
              <Details>
                {entry.bags} Bags - {workType} ({entry.workDetail})
              </Details>
              <SplitsInfo>
                <div>
                  <SplitItem>
                    <WorkerName>{entry.workerName}:</WorkerName>
                    <WorkerDetails>
                      🎯 {entry.bags} bags × ₹{(entry.ratePerBag || entry.rateperbag || (entry.totalAmount / entry.bags) || 0).toFixed(2)} = ₹{entry.totalAmount.toFixed(0)} 🎯
                    </WorkerDetails>
                  </SplitItem>
                </div>
              </SplitsInfo>
            </EntryRow>
          ))
        )}
      </Section>
    );
  };

  return (
    <Container>
      <FilterSection>
        <label style={{ fontWeight: 'bold', color: '#000' }}>Select Date:</label>
        <DateInput
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        {((activeTab === 'paddy' && summary && summary.totalEntries > 0) || 
          (activeTab === 'rice' && riceHamaliSummary && riceHamaliSummary.totalEntries > 0)) && (
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            📄 Download PDF
          </button>
        )}
      </FilterSection>

      {/* Paddy/Rice Tabs */}
      <TabContainer>
        <Tab active={activeTab === 'paddy'} onClick={() => setActiveTab('paddy')}>
          🌾 Paddy Hamali
        </Tab>
        <Tab active={activeTab === 'rice'} onClick={() => setActiveTab('rice')}>
          🍚 Rice Hamali
        </Tab>
      </TabContainer>

      <BookCard>
        <Header>
          <Title>🔥 {activeTab === 'paddy' ? 'Paddy Hamali' : 'Rice Hamali'} Book Summary - RATE FIX APPLIED 🔥</Title>
          <DateDisplay>{formatDate(selectedDate)}</DateDisplay>
        </Header>

        {loading ? (
          <LoadingState>Loading hamali summary...</LoadingState>
        ) : activeTab === 'paddy' ? (
          /* Paddy Hamali Content */
          !summary || summary.totalEntries === 0 ? (
            <EmptyState>
              <p>No approved paddy hamali entries found for {formatDate(selectedDate)}</p>
            </EmptyState>
          ) : (
            <>
              {/* Paddy Hamali Sections */}
              {renderPaddySection(summary.loadingEntries || [], 'Paddy Loading')}
              {renderPaddySection(summary.unloadingEntries || [], 'Paddy Unloading')}
              {renderPaddySection(summary.looseEntries || [], 'Loose Tumbiddu')}
              {renderPaddySection(summary.cuttingEntries || [], 'Paddy Cutting')}
              {renderPaddySection(summary.plottingEntries || [], 'Plotting')}
              {renderPaddySection(summary.shiftingEntries || [], 'Paddy Shifting')}
              {renderPaddySection(summary.fillingEntries || [], 'Paddy Filling with Stitching')}

              {/* Other Hamali Works Section */}
              {renderOtherHamaliSection()}

              {/* Total */}
              <TotalRow>
                <Amount>₹{summary.grandTotal.toFixed(0)}</Amount>
                <Details>
                  Total
                  {summary && renderBatchTotals(calculateBatchTotals(summary))}
                </Details>
                <SplitsInfo></SplitsInfo>
              </TotalRow>
            </>
          )
        ) : (
          /* Rice Hamali Content */
          !riceHamaliSummary || riceHamaliSummary.totalEntries === 0 ? (
            <EmptyState>
              <p>No rice hamali entries found for {formatDate(selectedDate)}</p>
            </EmptyState>
          ) : (
            <>
              {/* Rice Hamali Sections - Group by work type like paddy hamali */}
              {Object.entries(riceHamaliSummary.riceHamaliEntries).map(([workType, entries]: [string, any]) => (
                <Section key={workType}>
                  <SectionTitle>{workType}:</SectionTitle>
                  {entries.map((entry: any, index: number) => (
                    <EntryRow key={`${workType}-${index}`}>
                      <Amount>₹{entry.totalAmount.toFixed(0)}</Amount>
                      <Details>
                        {entry.bags} Bags - {entry.workDetail}
                        <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                          Variety: {entry.variety} | Location: {entry.location}
                          {entry.billNumber && ` | Bill: ${entry.billNumber}`}
                          {entry.lorryNumber && ` | Lorry: ${entry.lorryNumber}`}
                          {entry.productType && ` | Type: ${entry.productType}`}
                        </div>
                      </Details>
                      <SplitsInfo>
                        <div>
                          <SplitItem>
                            <WorkerName>{entry.workerName}:</WorkerName>
                            <WorkerDetails>
                              🎯 {entry.bags} bags × ₹{(entry.ratePerBag || entry.rateperbag || (entry.totalAmount / entry.bags) || 0).toFixed(2)} = ₹{entry.totalAmount.toFixed(0)} 🎯
                            </WorkerDetails>
                          </SplitItem>
                        </div>
                      </SplitsInfo>
                    </EntryRow>
                  ))}
                </Section>
              ))}

              {/* Other Hamali Works Section - Only show if other hamali entries exist */}
              {Object.keys(riceHamaliSummary.otherHamaliEntries).length > 0 && renderRiceOtherHamaliSection()}

              {/* Total */}
              <TotalRow>
                <Amount>₹{riceHamaliSummary.grandTotal.toFixed(0)}</Amount>
                <Details>
                  Total
                  {riceHamaliSummary && renderBatchTotals(calculateRiceBatchTotals(riceHamaliSummary))}
                </Details>
                <SplitsInfo></SplitsInfo>
              </TotalRow>
            </>
          )
        )}
      </BookCard>


    </Container>
  );
};

export default HamaliBookSimple;