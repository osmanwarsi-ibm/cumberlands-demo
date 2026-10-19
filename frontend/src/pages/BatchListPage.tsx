/**
 * Batch List Page
 * 
 * Displays all statement batches with their status and line counts.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { reconciliationAPI } from '../api/client';

interface BatchListItem {
  batch_id: string;
  status: string;
  total_lines: number;
  accepted_lines: number;
  rejected_lines: number;
  created_at?: string | null;
  matched_at?: string | null;
}

interface BatchListResponse {
  batches: BatchListItem[];
  total: number;
}

export function BatchListPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    try {
      setLoading(true);
      const response = await reconciliationAPI.listBatches();
      setBatches(response.batches);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
      setError('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): 'gray' | 'blue' | 'green' | 'red' {
    if (status === 'COMPLETED') return 'green';
    if (status === 'PARTIAL') return 'blue';
    if (status === 'FAILED') return 'red';
    return 'gray';
  }

  return (
    <div>
      <Header />
      
      <main style={{ padding: '24px 32px 48px' }}>
        <h1 style={{ fontFamily: 'var(--fh)', fontSize: '30px', margin: '0 0 6px' }}>
          Statement batches
        </h1>
        <p style={{ color: 'var(--ink2)', margin: '0 0 20px', fontSize: '16px' }}>
          All ingested statement batches and their processing status.
        </p>

        {loading && (
          <p style={{ color: 'var(--ink2)', padding: '20px' }}>Loading batches...</p>
        )}

        {error && (
          <div style={{ 
            padding: '16px', 
            background: 'var(--red-bg)', 
            border: '1px solid var(--red-border)',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <p style={{ color: 'var(--red-text)', margin: 0 }}>{error}</p>
          </div>
        )}

        {!loading && !error && batches.length === 0 && (
          <Card>
            <p style={{ color: 'var(--ink2)', margin: 0 }}>No batches found. Start by ingesting a statement batch.</p>
          </Card>
        )}

        {!loading && !error && batches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {batches.map((batch) => (
              <Card 
                key={batch.batch_id}
                style={{ 
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onClick={() => navigate(`/batches/${batch.batch_id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--blue-border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ 
                      fontFamily: 'var(--fh)', 
                      fontSize: '18px', 
                      margin: '0 0 8px',
                      color: 'var(--blue-text)'
                    }}>
                      Batch {batch.batch_id}
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--ink2)' }}>
                      <span>Total: {batch.total_lines}</span>
                      <span>Accepted: {batch.accepted_lines}</span>
                      <span>Rejected: {batch.rejected_lines}</span>
                    </div>
                    {batch.created_at && (
                      <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '4px 0 0' }}>
                        Created: {new Date(batch.created_at).toLocaleString()}
                      </p>
                    )}
                    {batch.matched_at && (
                      <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '4px 0 0' }}>
                        Matched: {new Date(batch.matched_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Chip color={getStatusColor(batch.status)}>{batch.status}</Chip>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
