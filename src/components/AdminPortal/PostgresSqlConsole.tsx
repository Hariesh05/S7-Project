import React, { useState } from 'react';
import { Database, Play, Code, CheckCircle, Terminal } from 'lucide-react';

export const PostgresSqlConsole: React.FC = () => {
  const [query, setQuery] = useState('SELECT * FROM skills LIMIT 10;');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'schema'>('console');
  const [schemaSql, setSchemaSql] = useState<string>('');

  const quickQueries = [
    { label: 'All Skills', sql: 'SELECT * FROM skills LIMIT 10;' },
    { label: 'Active Jobs', sql: 'SELECT * FROM jobs LIMIT 10;' },
    { label: 'Users & Roles', sql: 'SELECT * FROM users;' },
    { label: 'List App Tables', sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'career_app' ORDER BY table_name;" },
  ];

  const runQuery = async (queryToRun = query) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToRun }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('SQL query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSchema = async () => {
    try {
      const res = await fetch('/api/admin/schema-sql');
      const text = await res.text();
      setSchemaSql(text);
      setActiveTab('schema');
    } catch (err) {
      console.error('Failed to load schema:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              PostgreSQL Schema & SQL Query Console
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Live read-only SQL access to this application's Supabase PostgreSQL schema.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'console'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            SQL Runner
          </button>
          <button
            onClick={loadSchema}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'schema'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Inspect Application Schema
          </button>
        </div>
      </div>

      {activeTab === 'console' ? (
        <div className="space-y-4">
          {/* Quick Query presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Queries:
            </span>
            {quickQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(q.sql);
                  runQuery(q.sql);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="relative">
            <textarea
              rows={3}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter SQL query (e.g. SELECT * FROM skills;)..."
              className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              onClick={() => runQuery()}
              disabled={loading}
              className="absolute right-3 bottom-3.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Execute SQL</span>
                </>
              )}
            </button>
          </div>

          {/* Results Table */}
          {result && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Returned <strong>{result.rowCount} rows</strong>
                </span>
                <span>
                  Query execution time: <strong className="text-emerald-600">{result.executionTimeMs} ms</strong>
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px]">
                    <tr>
                      {result.columns?.map((col: string) => (
                        <th key={col} className="px-4 py-2.5">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                    {result.rows?.map((row: any[], i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {row.map((cell: any, j: number) => (
                          <td key={j} className="px-4 py-2 whitespace-nowrap">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Official PostgreSQL DDL definition for all 17 system entities</span>
            <span className="font-semibold text-indigo-600">Read-only transaction</span>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
            {schemaSql || 'Loading schema...'}
          </pre>
        </div>
      )}
    </div>
  );
};
