import { useEffect, useState } from 'react';

export default function EditorialApprovalRisk() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/editorial-approval-risk').then((res) => res.json()).then(setData).catch(() => setData(null));
  }, []);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Editorial Approval Risk</h1>
      <p className="text-gray-600 mb-6">Find content drafts likely to fail brand, legal, or editorial approval.</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {data && Object.entries(data.summary).map(([key, value]) => <div key={key} className="bg-white border rounded-lg p-4"><div className="text-xs uppercase text-gray-500">{key.replaceAll('_', ' ')}</div><div className="text-2xl font-bold">{value}</div></div>)}
      </div>
      <div className="bg-white border rounded-lg">
        {(data?.drafts || []).map((item) => <div key={item.draft} className="p-4 border-b"><strong>{item.draft}</strong><div>{item.channel} - {item.risk} risk - {item.reason} - {item.action}</div></div>)}
      </div>
    </div>
  );
}
