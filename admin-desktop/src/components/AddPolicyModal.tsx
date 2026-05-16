import React, { useState } from 'react';
import axios from 'axios';
import { PlusCircle, X } from 'lucide-react';

const API_URL = 'https://api.securefirst.co/api/policy';

interface AddPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPolicyModal = ({ isOpen, onClose }: AddPolicyModalProps) => {
  const [formData, setFormData] = useState({
    clientName: '',
    mobileNumber: '',
    clientEmail: '',
    policyType: '',
    vehicleNumber: '',
    insurer: '',
    issueDate: '',
    expiryDate: '',
    sumInsured: '',
    annualPremium: '',
    attachedDocument: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({ ...formData, attachedDocument: e.target.files[0].name });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const randomID = Math.floor(1000 + Math.random() * 9000);
      const generatedPolicyNumber = `${formData.policyType.toUpperCase().substring(0, 3)}-${randomID}`;
      
      const dataToSubmit = { 
        ...formData, 
        policyNumber: generatedPolicyNumber 
      };

      if (dataToSubmit.policyType === 'Motor') {
        dataToSubmit.sumInsured = '0'; 
      }
      await axios.post(API_URL, dataToSubmit);
      alert('Policy saved successfully!');
      setFormData({
        clientName: '', mobileNumber: '', clientEmail: '', policyType: '',
        vehicleNumber: '', insurer: '', issueDate: '', expiryDate: '',
        sumInsured: '', annualPremium: '', attachedDocument: ''
      });
      onClose();
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to save policy');
    } finally {
      setLoading(false);
    }
  };

  const isMotor = formData.policyType === 'Motor';

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '4rem', zIndex: 1000, overflowY: 'auto' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '1200px', position: 'relative', marginBottom: '4rem', padding: '2rem' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={28} />
        </button>

        <h2 className="flex items-center gap-2" style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>
          <PlusCircle color="var(--accent-gold)" size={32} /> New Policy
        </h2>

        {errorMsg && <div style={{ background: 'var(--accent-danger)', color: '#fff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>1. Client Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name *</label>
                <input type="text" name="clientName" value={formData.clientName} onChange={handleChange} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Mobile Number *</label>
                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} maxLength={10} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
                <input type="email" name="clientEmail" value={formData.clientEmail} onChange={handleChange} style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>2. Policy Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Policy Type *</label>
                <select name="policyType" value={formData.policyType} onChange={handleChange} required style={{ width: '100%' }}>
                  <option value="">Select Type</option>
                  <option value="Motor">Motor</option>
                  <option value="Home">Home</option>
                  <option value="Travel">Travel</option>
                </select>
              </div>
              {isMotor && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Vehicle Number *</label>
                  <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} required style={{ width: '100%' }} />
                </div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Insurer Company *</label>
                <input type="text" name="insurer" value={formData.insurer} onChange={handleChange} required style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>3. Financials & Dates</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Issue Date *</label>
                <input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Expiry Date *</label>
                <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Sum Insured (₹)*</label>
                <input type="number" name="sumInsured" value={formData.sumInsured} onChange={handleChange} required style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Annual Premium (₹)*</label>
                <input type="number" name="annualPremium" value={formData.annualPremium} onChange={handleChange} required style={{ width: '100%' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Policy Document (PDF) *</label>
                <input type="file" accept=".pdf" onChange={handleFileChange} required style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem', marginTop: '1rem' }}>
            {loading ? 'Saving...' : 'Save Policy'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddPolicyModal;
