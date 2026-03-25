export const getDummyPolicies = (mobile: string) => [
  { 
    _id: 'dummy1', 
    clientName: 'Demo User', 
    mobileNumber: mobile, 
    clientEmail: 'demo@securefirst.in', 
    policyType: 'Motor', 
    policyNumber: 'MOT-9999', 
    vehicleNumber: 'KA01XY1234',
    insurer: 'Secure Motor Plus', 
    issueDate: new Date(Date.now() - 30 * 86400000).toISOString(), 
    expiryDate: new Date(Date.now() + 10 * 86400000).toISOString(), 
    sumInsured: 500000, 
    annualPremium: 12000, 
    attachedDocument: 'Motor_Policy_Document.pdf' 
  },
  { 
    _id: 'dummy2', 
    clientName: 'Demo User', 
    mobileNumber: mobile, 
    clientEmail: 'demo@securefirst.in', 
    policyType: 'Motor', 
    policyNumber: 'MOT-8888', 
    vehicleNumber: 'MH02AB9876',
    insurer: 'DriveSafe Auto', 
    issueDate: new Date(Date.now() - 200 * 86400000).toISOString(), 
    expiryDate: new Date(Date.now() + 120 * 86400000).toISOString(), 
    sumInsured: 300000, 
    annualPremium: 8500 
  }
];
