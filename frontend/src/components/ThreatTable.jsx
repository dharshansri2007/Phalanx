import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function ThreatTable() {
  const threats = [
    { id: 'TX-001', risk: 'CRITICAL', type: 'Obfuscated JS', source: 'SERP_Node_4', status: 'QUARANTINED' },
    { id: 'TX-002', risk: 'HIGH', type: 'Base64 Injection', source: 'SERP_Node_1', status: 'QUARANTINED' },
    { id: 'TX-003', risk: 'LOW', type: 'Normal Prose', source: 'Internal_API', status: 'CLEARED' },
    { id: 'TX-004', risk: 'HIGH', type: 'Suspicious Regex', source: 'SERP_Node_2', status: 'QUARANTINED' },
  ];

  return (
    <div className="bg-black border border-phalanx-border p-6 w-full font-mono text-sm overflow-x-auto">
      <div className="text-gray-400 mb-6 flex items-center pb-4 border-b border-gray-800">
        <AlertTriangle className="w-5 h-5 mr-2 text-phalanx-warning animate-pulse" />
        ACTION REQUIRED: PAYLOADS PENDING MANUAL REVIEW
      </div>
      
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="text-gray-500 border-b border-gray-800 uppercase text-xs tracking-widest">
            <th className="pb-3 px-2">Tx ID</th>
            <th className="pb-3 px-2">Risk Level</th>
            <th className="pb-3 px-2">Signature</th>
            <th className="pb-3 px-2">Ingestion Node</th>
            <th className="pb-3 px-2 text-right">SOC Override</th>
          </tr>
        </thead>
        <tbody>
          {threats.map((t, i) => (
            <tr key={i} className="border-b border-gray-900 text-gray-300 hover:bg-gray-900/50 transition-colors">
              <td className="py-4 px-2">{t.id}</td>
              <td className={`py-4 px-2 font-bold ${t.risk === 'HIGH' || t.risk === 'CRITICAL' ? 'text-phalanx-danger' : 'text-phalanx-safe'}`}>
                {t.risk}
              </td>
              <td className="py-4 px-2">{t.type}</td>
              <td className="py-4 px-2 text-gray-500">{t.source}</td>
              <td className="py-4 px-2 flex justify-end space-x-4">
                <button title="Force Approve" className="text-gray-600 hover:text-phalanx-safe transition-colors">
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button title="Permanent Reject" className="text-gray-600 hover:text-phalanx-danger transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}