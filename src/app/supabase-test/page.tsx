'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

export default function SupabaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing connection...');
  const [sampleStudent, setSampleStudent] = useState<string | null>(null);

// src/app/supabase-test/page.tsx

useEffect(() => {
    async function testDb() {
      // Query the students table, limit the result to 1 row, and get it as an array
      const { data, error } = await supabase
        .from('students')
        .select('name')
        .limit(1);
  
      if (error) {
        setConnectionStatus(`Connection failed: ${error.message}`);
      } else if (data && data.length > 0) {
        setConnectionStatus('Connected successfully to Supabase!');
        // Since 'data' is returned as an array, grab the first element [0]
        setSampleStudent(data[0].name);
      } else {
        setConnectionStatus('Connected to Supabase, but the students table is empty.');
      }
    }
  
    testDb();
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">GIKonnect Database Test</h1>
      <p className="text-lg text-emerald-400 mb-2">{connectionStatus}</p>
      {sampleStudent && (
        <p className="text-slate-400">
          Successfully read sample student from DB: <span className="text-white font-semibold">{sampleStudent}</span>
        </p>
      )}
    </div>
  );
}