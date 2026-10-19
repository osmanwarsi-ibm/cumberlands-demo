/**
 * ApQueuePage - AP queue and settlement preparation
 * Matches wireframe_ap_queue_from_batch_match_results.html design exactly
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { queueAPI, settlementAPI } from '../api/client';
import { Header } from '../components/Header';
import { Mockbar } from '../components/Mockbar';
import { Breadcrumb } from '../components/Breadcrumb';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { Table } from '../components/Table';

interface ApQueueStats {
  eligible: number;
  queued: number;
  held: number;
  failed: number;
}

interface EligibleSettlement {
  case_id: string;
  source_description: string;
  resolution_basis: string;
  approver_username: string | null;
  amount: number;
  is_sod_blocked: boolean;
  hint?: string;
}

interface UnresolvedItem {
  case_id: string;
  status: string;
  reason: string;
}

interface QueueEntry {
  queue_entry_id: string;
  settlement_record_id: string;
  queue_status: string;
  ack_status: string;
  created_at: string;
  failure_reason: string | null;
}

interface SodViolation {
  case_id: string;
  actor_username: string;
  timestamp: string;
}

interface ApQueueFailure {
  case_id: string;
  message: string;
}

export function ApQueuePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState<ApQueueStats>({
    eligible: 44,
    queued: 12,
    held: 2,
    failed: 1,
  });
  
  const [sodViolation, setSodViolation] = useState<SodViolation | null>({
    case_id: 'CASE-C-1042',
    actor_username: 'Dana Whitfield',
    timestamp: '14:38:44 UTC',
  });
  
  const [apQueueFailure, setApQueueFailure] = useState<ApQueueFailure | null>({
    case_id: 'CASE-C-1031',
    message: 'The mocked AP interface did not respond (502). The settlement record is saved; the queue entry is FAILED. Review and retry below.',
  });
  
  const [eligibleSettlements, setEligibleSettlements] = useState<EligibleSettlement[]>([
    {
      case_id: 'CASE-C-1042',
      source_description: 'Heavy Cream 1 pt, Coastal Dairy',
      resolution_basis: 'HUMAN-APPROVED cost exception',
      approver_username: 'Dana Whitfield',
      amount: 104.40,
      is_sod_blocked: true,
      hint: 'You are not the approver',
    },
    {
      case_id: 'CASE-C-1033',
      source_description: 'Pretzel Crisps 7oz, Yankee Snack',
      resolution_basis: 'HUMAN-APPROVED cost exception',
      approver_username: 'Dana Whitfield',
      amount: 173.52,
      is_sod_blocked: false,
    },
    {
      case_id: 'CASE-Q-2190',
      source_description: 'Sparkling Water 12pk, Atlantic',
      resolution_basis: 'HUMAN-APPROVED quantity exception, short-ship credit',
      approver_username: 'Marcus Ortiz',
      amount: 214.20,
      is_sod_blocked: false,
    },
    {
      case_id: 'L-001 to L-009 (+38 more)',
      source_description: '41 full-match lines in batch',
      resolution_basis: 'FULL MATCH no review needed',
      approver_username: null,
      amount: 6482.17,
      is_sod_blocked: false,
    },
  ]);
  
  const [unresolvedItems, setUnresolvedItems] = useState<UnresolvedItem[]>([
    {
      case_id: 'CASE-Q-2201',
      status: 'MANUAL REVIEW',
      reason: 'Mandatory manual routing; no decision yet',
    },
    {
      case_id: 'CASE-C-1049',
      status: 'AWAITING DECISION',
      reason: 'Confidence 61%; no recommendation, no decision yet',
    },
    {
      case_id: 'CASE-Q-2209',
      status: 'ESCALATED',
      reason: 'Unmatched invoice over $500, waiting for Inventory Control decision',
    },
  ]);
  
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([
    {
      queue_entry_id: 'APQ-000118',
      settlement_record_id: 'SR-000412',
      queue_status: 'QUEUED',
      ack_status: 'ACCEPTED',
      created_at: '14:41:02',
      failure_reason: null,
    },
    {
      queue_entry_id: 'APQ-000119',
      settlement_record_id: 'SR-000413',
      queue_status: 'QUEUED',
      ack_status: 'PENDING',
      created_at: '14:41:03',
      failure_reason: 'Awaiting mock acknowledgement',
    },
    {
      queue_entry_id: 'APQ-000120',
      settlement_record_id: 'SR-000414',
      queue_status: 'HELD',
      ack_status: 'PENDING',
      created_at: '14:41:05',
      failure_reason: 'Vendor remit-to data incomplete in fixture; held for AP review',
    },
    {
      queue_entry_id: 'APQ-000121',
      settlement_record_id: 'SR-000415',
      queue_status: 'HELD',
      ack_status: 'PENDING',
      created_at: '14:41:06',
      failure_reason: 'Posting-preparation issue: invoice reference duplicate check',
    },
    {
      queue_entry_id: 'APQ-000122',
      settlement_record_id: 'SR-000416',
      queue_status: 'FAILED',
      ack_status: 'REJECTED',
      created_at: '14:41:09',
      failure_reason: 'Mock interface unavailable (502); retry allowed',
    },
  ]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handlePrepareSettlement = async (caseId: string) => {
    if (!user) return;
    
    try {
      await settlementAPI.prepareSettlement(caseId, {
        prepared_by_user_id: user.id,
      });
      
      alert(`Settlement prepared for ${caseId}`);
      // Reload data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to prepare settlement');
    }
  };

  const handleRetryFailed = () => {
    alert('Retry functionality will reload queue entry');
  };

  if (loading) {
    return (
      <div>
        <Header />
        <Mockbar message="MOCKED AP INTERFACE: entries below go to a local pilot queue. Nothing is sent to Oracle AP and no payment is released." />
        <div style={{ padding: '24px 32px' }}>
          <p>Loading AP queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <Mockbar message="MOCKED AP INTERFACE: entries below go to a local pilot queue. Nothing is sent to Oracle AP and no payment is released." />
        <div style={{ padding: '24px 32px' }}>
          <Banner color="red">{error}</Banner>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <Mockbar message="MOCKED AP INTERFACE: entries below go to a local pilot queue. Nothing is sent to Oracle AP and no payment is released." />
      
      <main style={{ padding: '24px 32px 48px' }}>
        <Breadcrumb
          items={[
            { label: 'Batch results', path: '/batches' },
            { label: 'AP queue and settlement' },
          ]}
        />
        
        <h1 style={{ fontFamily: 'var(--fh)', fontSize: '30px', margin: '0 0 6px' }}>
          AP queue and settlement preparation
        </h1>
        <p style={{ color: 'var(--ink2)', margin: '0 0 20px', fontSize: '16px' }}>
          Prepare settlement for full matches and human-approved exceptions, then monitor the mocked AP interface queue for this batch.
        </p>

        {/* KPI Cards */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
          <div
            style={{
              flex: 1,
              border: '1px solid var(--line)',
              borderLeft: '6px solid var(--gn)',
              borderRadius: '6px',
              padding: '12px 14px',
              background: 'var(--sf)',
            }}
          >
            <b style={{ display: 'block', fontFamily: 'var(--fh)', fontSize: '28px' }}>
              {stats.eligible}
            </b>
            <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
              <Chip color="green">ELIGIBLE</Chip> to prepare
            </span>
          </div>
          
          <div
            style={{
              flex: 1,
              border: '1px solid var(--line)',
              borderLeft: '6px solid var(--bl)',
              borderRadius: '6px',
              padding: '12px 14px',
              background: 'var(--sf)',
            }}
          >
            <b style={{ display: 'block', fontFamily: 'var(--fh)', fontSize: '28px' }}>
              {stats.queued}
            </b>
            <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
              <Chip color="blue">QUEUED</Chip> in AP queue, ack pending or accepted
            </span>
          </div>
          
          <div
            style={{
              flex: 1,
              border: '1px solid var(--line)',
              borderLeft: '6px solid #C98A12',
              borderRadius: '6px',
              padding: '12px 14px',
              background: 'var(--sf)',
            }}
          >
            <b style={{ display: 'block', fontFamily: 'var(--fh)', fontSize: '28px' }}>
              {stats.held}
            </b>
            <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
              <Chip color="amber">HELD</Chip> in AP queue
            </span>
          </div>
          
          <div
            style={{
              flex: 1,
              border: '1px solid var(--line)',
              borderLeft: '6px solid var(--rd)',
              borderRadius: '6px',
              padding: '12px 14px',
              background: 'var(--sf)',
            }}
          >
            <b style={{ display: 'block', fontFamily: 'var(--fh)', fontSize: '28px' }}>
              {stats.failed}
            </b>
            <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
              <Chip color="red">FAILED</Chip> write to AP queue
            </span>
          </div>
        </div>

        {/* SoD Violation Banner */}
        {sodViolation && (
          <Banner color="red">
            <div style={{ display: 'flex', gap: '12px' }}>
              <svg
                style={{
                  width: '18px',
                  height: '18px',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                  flexShrink: 0,
                }}
                viewBox="0 0 24 24"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div>
                <b>Blocked: segregation of duties.</b> {sodViolation.actor_username} approved{' '}
                {sodViolation.case_id}. A different user must prepare its settlement. An attempt by
                the approver was refused (403) at {sodViolation.timestamp} and recorded in the audit
                trace.
              </div>
            </div>
          </Banner>
        )}

        {/* AP Queue Failure Banner */}
        {apQueueFailure && (
          <Banner color="amber">
            <div style={{ display: 'flex', gap: '12px' }}>
              <svg
                style={{
                  width: '18px',
                  height: '18px',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                  flexShrink: 0,
                }}
                viewBox="0 0 24 24"
              >
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
              <div>
                <b>AP queue write failed for {apQueueFailure.case_id}.</b>{' '}
                {apQueueFailure.message}
              </div>
            </div>
          </Banner>
        )}

        {/* Main Content Row */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Column */}
          <div style={{ flex: '1.1 1 0', minWidth: 0 }}>
            {/* Eligible Settlements */}
            <Card>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: 'var(--ink2)',
                  marginBottom: '6px',
                }}
              >
                Ready for you
              </span>
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                Eligible for settlement preparation
              </h2>
              
              <Table
                columns={[
                  { key: 'case', header: 'Case / source', render: (item: EligibleSettlement) => (
                      <div>
                        <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>
                          {item.case_id}
                        </span>
                        <br />
                        <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
                          {item.source_description}
                        </span>
                      </div>
                    )},
                  { key: 'resolution', header: 'Resolution basis', render: (item: EligibleSettlement) => {
                    const chipColor = item.resolution_basis.includes('FULL MATCH')
                      ? 'green'
                      : 'green';
                    const chipText = item.resolution_basis.includes('FULL MATCH')
                      ? 'FULL MATCH'
                      : 'HUMAN-APPROVED';
                    const restText = item.resolution_basis
                      .replace('HUMAN-APPROVED', '')
                      .replace('FULL MATCH', '')
                      .trim();
                    return (
                      <div>
                        <Chip color={chipColor}>{chipText}</Chip> {restText}
                      </div>
                    );
                  }},
                  { key: 'approver', header: 'Approver', render: (item: EligibleSettlement) => item.approver_username || 'None required' },
                  { key: 'amount', header: 'Amount', render: (item: EligibleSettlement) => (
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ${item.amount.toFixed(2)}
                      </span>
                    )},
                  { key: 'action', header: 'Action', render: (item: EligibleSettlement) => {
                    const buttonText = item.case_id.includes('+')
                      ? 'Prepare all full matches (41)'
                      : 'Prepare settlement';
                    return (
                      <div>
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handlePrepareSettlement(item.case_id)}
                          disabled={item.is_sod_blocked}
                        >
                          <svg
                            style={{ width: '14px', height: '14px' }}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="m22 2-7 20-4-9-9-4zM22 2 11 13" />
                          </svg>
                          {buttonText}
                        </Button>
                        {item.hint && (
                          <>
                            <br />
                            <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
                              {item.hint}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  }},
                ]}
                data={eligibleSettlements}
                keyExtractor={(item) => item.case_id}
              />
              
              <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '10px 0 0' }}>
                Optional: after preparing a settlement for an approved exception, generate
                chargeback or credit-request support. It is stored as a document record only.
              </p>
            </Card>

            {/* Unresolved Review Items */}
            <Card>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: 'var(--ink2)',
                  marginBottom: '6px',
                }}
              >
                Not ready: waiting on a person
              </span>
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                Unresolved review items (not posted)
              </h2>
              
              <Table
                columns={[
                  { key: 'case', header: 'Case', render: (item: UnresolvedItem) => (
                      <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>
                        {item.case_id}
                      </span>
                    )},
                  { key: 'status', header: 'Status', render: (item: UnresolvedItem) => {
                    const chipColor =
                      item.status === 'MANUAL REVIEW'
                        ? 'red'
                        : item.status === 'ESCALATED'
                        ? 'amber'
                        : 'amber';
                    return <Chip color={chipColor}>{item.status}</Chip>;
                  }},
                  { key: 'reason', header: 'Why it is not posted', render: (item: UnresolvedItem) => item.reason },
                ]}
                data={unresolvedItems}
                keyExtractor={(item) => item.case_id}
              />
              
              <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '10px 0 0' }}>
                AMBER cases are never posted without a recorded human decision. 15 more cases are in
                the queues.
              </p>
            </Card>
          </div>

          {/* Right Column */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            {/* Queue Entries */}
            <Card>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: 'var(--ink2)',
                  marginBottom: '6px',
                }}
              >
                Mocked AP interface
              </span>
              <h2 style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                Queue entries for this batch
              </h2>
              
              <Table
                columns={[
                  { key: 'queue_entry', header: 'Queue entry', render: (item: QueueEntry) => (
                      <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>
                        {item.queue_entry_id}
                      </span>
                    )},
                  { key: 'settlement', header: 'Settlement record', render: (item: QueueEntry) => (
                      <span style={{ fontFamily: 'var(--fm)', fontSize: '13px' }}>
                        {item.settlement_record_id}
                      </span>
                    )},
                  { key: 'queue_status', header: 'Queue status', render: (item: QueueEntry) => {
                    const chipColor =
                      item.queue_status === 'QUEUED'
                        ? 'blue'
                        : item.queue_status === 'HELD'
                        ? 'amber'
                        : 'red';
                    return <Chip color={chipColor}>{item.queue_status}</Chip>;
                  }},
                  { key: 'ack_status', header: 'Ack status', render: (item: QueueEntry) => {
                    const chipColor =
                      item.ack_status === 'ACCEPTED'
                        ? 'green'
                        : item.ack_status === 'REJECTED'
                        ? 'red'
                        : 'gray';
                    return <Chip color={chipColor}>{item.ack_status}</Chip>;
                  }},
                  { key: 'created', header: 'Created (UTC)', render: (item: QueueEntry) => item.created_at },
                  { key: 'reason', header: 'Reason / failure', render: (item: QueueEntry) => item.failure_reason || '—' },
                ]}
                data={queueEntries}
                keyExtractor={(item) => item.queue_entry_id}
              />
              
              <div style={{ margin: '14px 0 0', display: 'flex', gap: '10px' }}>
                <Button variant="secondary" size="small" onClick={handleRetryFailed}>
                  Retry failed entry APQ-000122
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate('/audit/case/1042')}
                >
                  Open audit trace
                </Button>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '10px 0 0' }}>
                Showing 5 of 15 entries. Held and failed entries are posting-preparation issues,
                separate from unresolved review items on the left.
              </p>
            </Card>

            {/* Info Banner */}
            <Banner color="blue">
              <div style={{ display: 'flex', gap: '12px' }}>
                <svg
                  style={{
                    width: '18px',
                    height: '18px',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: 2,
                    flexShrink: 0,
                  }}
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <div>
                  Every settlement record keeps the source case, the resolution basis, the approver
                  identity and the preparer identity, so approval and posting preparation are always
                  done by different people.
                </div>
              </div>
            </Banner>
          </div>
        </div>
      </main>

      <footer
        style={{
          padding: '16px 32px',
          borderTop: '1px solid var(--line)',
          fontSize: '13px',
          color: 'var(--ink2)',
        }}
      >
        Pilot build &middot; fixture data only &middot; vendor, item and user names are fictional.
        No live Oracle AP connection.
      </footer>
    </div>
  );
}
