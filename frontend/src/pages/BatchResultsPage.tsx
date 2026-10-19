/**
 * BatchResultsPage - Three-way match results
 * Matches wireframe_batch_match_results_from_statement_intake.html design exactly
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';

interface MatchResult {
  line_id: string;
  vendor_item: string;
  statement_qty: number;
  received_qty: number;
  statement_cost: number;
  expected_cost: number;
  outcome: string;
  basis: string;
  routing: string;
}

export function BatchResultsPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullMatchCount, setFullMatchCount] = useState(41);
  const [costExceptionCount, setCostExceptionCount] = useState(9);
  const [quantityExceptionCount, setQuantityExceptionCount] = useState(5);
  const [unmatchedStatementCount, setUnmatchedStatementCount] = useState(2);
  const [unmatchedReceiptCount, setUnmatchedReceiptCount] = useState(2);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [outcomeFilter, setOutcomeFilter] = useState('All outcomes');
  const [vendorFilter, setVendorFilter] = useState('All vendors');
  const [routingFilter, setRoutingFilter] = useState('All');

  useEffect(() => {
    // Mock results data matching wireframe
    const mockResults: MatchResult[] = [
      {
        line_id: 'L-001',
        vendor_item: 'Coastal Dairy Co. · Whole Milk 1 gal',
        statement_qty: 48,
        received_qty: 48,
        statement_cost: 3.12,
        expected_cost: 3.12,
        outcome: 'FULL MATCH',
        basis: 'Qty variance 0 units; cost variance $0.0000',
        routing: 'None',
      },
      {
        line_id: 'L-004',
        vendor_item: 'Coastal Dairy Co. · 2% Milk 1 gal',
        statement_qty: 36,
        received_qty: 36,
        statement_cost: 3.04,
        expected_cost: 3.04,
        outcome: 'FULL MATCH',
        basis: 'Qty variance 0 units; cost variance $0.0000',
        routing: 'None',
      },
      {
        line_id: 'L-009',
        vendor_item: 'Granite State Bakery · White Bread 20oz',
        statement_qty: 60,
        received_qty: 59,
        statement_cost: 1.89,
        expected_cost: 1.89,
        outcome: 'FULL MATCH',
        basis: 'Qty variance 1 unit (1.67%): within both tolerances',
        routing: 'None',
      },
      {
        line_id: 'L-012',
        vendor_item: 'Atlantic Beverage Dist. · Cola 20oz 24pk',
        statement_qty: 30,
        received_qty: 30,
        statement_cost: 17.85,
        expected_cost: 17.6,
        outcome: 'COST EXCEPTION',
        basis: 'Cost variance $0.2500 > $0.05 tolerance',
        routing: 'Cost review',
      },
      {
        line_id: 'L-014',
        vendor_item: 'Yankee Snack Brands · Kettle Chips 8oz',
        statement_qty: 72,
        received_qty: 72,
        statement_cost: 2.41,
        expected_cost: 2.33,
        outcome: 'COST EXCEPTION',
        basis: 'Cost variance $0.0800 > $0.05 tolerance',
        routing: 'Cost review',
      },
      {
        line_id: 'L-021',
        vendor_item: 'Coastal Dairy Co. · Heavy Cream 1 pt',
        statement_qty: 24,
        received_qty: 24,
        statement_cost: 4.35,
        expected_cost: 3.9,
        outcome: 'COST EXCEPTION',
        basis: 'Cost variance $0.4500 > $0.05; 11.5% above Price Book (escalation flag)',
        routing: 'Cost review',
      },
      {
        line_id: 'L-025',
        vendor_item: 'Granite State Bakery · Hot Dog Rolls 8ct',
        statement_qty: 80,
        received_qty: 64,
        statement_cost: 2.1,
        expected_cost: 2.1,
        outcome: 'QUANTITY EXCEPTION',
        basis: 'Qty variance 16 units (20.0%) > 2 units AND > 2%',
        routing: 'Quantity review',
      },
      {
        line_id: 'L-027',
        vendor_item: 'Atlantic Beverage Dist. · Sparkling Water 12pk',
        statement_qty: 40,
        received_qty: 36,
        statement_cost: 5.95,
        expected_cost: 5.95,
        outcome: 'QUANTITY EXCEPTION',
        basis: 'Qty variance 4 units (10.0%) > 2 units AND > 2%',
        routing: 'Quantity review',
      },
      {
        line_id: 'L-031',
        vendor_item: 'Yankee Snack Brands · Pretzel Rods 10oz',
        statement_qty: 50,
        received_qty: 0,
        statement_cost: 3.2,
        expected_cost: 0,
        outcome: 'UNMATCHED STATEMENT',
        basis: 'No store receipt found for delivery DLV-77412',
        routing: 'Quantity review',
      },
      {
        line_id: 'L-033',
        vendor_item: 'Coastal Dairy Co. · Greek Yogurt 32oz',
        statement_qty: 0,
        received_qty: 18,
        statement_cost: 0,
        expected_cost: 4.8,
        outcome: 'UNMATCHED RECEIPT',
        basis: 'Receipt RCV-90318 has no statement line',
        routing: 'Quantity review',
      },
      {
        line_id: 'L-040',
        vendor_item: 'Atlantic Beverage Dist. · Iced Tea 16oz 12pk',
        statement_qty: 45,
        received_qty: 45,
        statement_cost: 7.1,
        expected_cost: 7.1,
        outcome: 'FULL MATCH',
        basis: 'Qty variance 0 units; cost variance $0.0000',
        routing: 'None',
      },
      {
        line_id: 'L-044',
        vendor_item: 'Yankee Snack Brands · Trail Mix 12oz',
        statement_qty: 28,
        received_qty: 28,
        statement_cost: 4.62,
        expected_cost: 4.6,
        outcome: 'FULL MATCH',
        basis: 'Cost variance $0.0200 within $0.05 tolerance',
        routing: 'None',
      },
    ];
    setResults(mockResults);
  }, []);

  const totalLines = fullMatchCount + costExceptionCount + quantityExceptionCount + unmatchedStatementCount + unmatchedReceiptCount;
  const straightThroughPct = ((fullMatchCount / totalLines) * 100).toFixed(1);

  const getOutcomeColor = (outcome: string): 'green' | 'amber' | 'red' | 'blue' | 'gray' => {
    if (outcome === 'FULL MATCH') return 'green';
    if (outcome === 'COST EXCEPTION') return 'amber';
    if (outcome === 'QUANTITY EXCEPTION') return 'red';
    if (outcome === 'UNMATCHED STATEMENT') return 'blue';
    return 'gray';
  };

  return (
    <div style={{ minWidth: '1440px', width: '100%', background: 'var(--bg)', position: 'relative' }}>
      <a
        href="#main"
        style={{
          display: 'block',
          padding: '8px 32px',
          background: 'var(--sf)',
          color: 'var(--prd)',
          fontSize: '13px',
        }}
      >
        Skip to main content
      </a>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--prd)',
          color: '#fff',
          padding: '0 32px',
          height: '64px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            fontFamily: 'var(--fh)',
            fontSize: '20px',
            fontWeight: 700,
          }}
        >
          <svg
            style={{
              width: '28px',
              height: '28px',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            viewBox="0 0 24 24"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            DSD Receiving Reconciliation
            <small
              style={{
                display: 'block',
                fontFamily: 'var(--fb)',
                fontSize: '12px',
                fontWeight: 400,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Vendor statement matching · Pilot MVP
            </small>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '4px', height: '64px' }} aria-label="Primary">
          <a
            href="/intake"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
              borderBottom: '4px solid transparent',
            }}
          >
            Statement intake
          </a>
          <a
            href={`/batches/${batchId}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
              borderBottom: '4px solid #F2C14E',
              fontWeight: 700,
              background: 'rgba(255,255,255,.1)',
            }}
            aria-current="page"
          >
            Batch results
          </a>
          <a
            href="/ap-queue"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
              borderBottom: '4px solid transparent',
            }}
          >
            AP queue
          </a>
          <a
            href="/audit"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
              borderBottom: '4px solid transparent',
            }}
          >
            Audit trace
          </a>
        </nav>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px' }}>
          <span>
            {user?.username} · <b>{user?.role.replace(/_/g, ' ')}</b>
          </span>
          <button
            onClick={signOut}
            style={{
              background: 'transparent',
              border: '1px solid #fff',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          background: 'var(--amb)',
          color: 'var(--am)',
          padding: '7px 32px',
          fontSize: '13px',
          borderBottom: '1px solid #E2C48A',
          fontWeight: 600,
        }}
      >
        <svg
          style={{
            width: '18px',
            height: '18px',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }}
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        Pilot environment: fixture data only. Match logic runs locally against sample receipts and Price Book records.
      </div>
      <main id="main" style={{ width: '100%', padding: '24px 32px 48px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '0 0 8px' }}>
          <a href="/intake" style={{ color: 'var(--bl)' }}>
            Statement intake
          </a>{' '}
          / Batch results · route /batches/{batchId}
        </p>
        <h1 style={{ fontFamily: 'var(--fh)', fontSize: '30px', margin: '0 0 6px' }}>Three-way match results</h1>
        <p style={{ color: 'var(--ink2)', margin: '0 0 20px', fontSize: '16px' }}>
          Batch <span style={{ fontFamily: 'var(--fm)' }}>BATCH-{batchId}</span> · source DSD-STMT-2026-W41 · matched
          2026-10-19 14:04:37 UTC · {totalLines - 3} accepted lines (3 quarantined at intake)
        </p>
        <ol
          style={{
            display: 'flex',
            margin: '0 0 20px',
            padding: 0,
            listStyle: 'none',
          }}
          aria-label="Workflow progress"
        >
          <li
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--gnb)',
              color: '#124A27',
              border: '1px solid var(--line)',
              fontSize: '14px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <svg
              style={{
                width: '18px',
                height: '18px',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: '2',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }}
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            1. Intake and validate
          </li>
          <li
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--prd)',
              color: '#fff',
              fontWeight: 700,
              border: '1px solid var(--line)',
              fontSize: '14px',
            }}
          >
            2. Three-way match
          </li>
          <li
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--sf2)',
              border: '1px solid var(--line)',
              fontSize: '14px',
            }}
          >
            3. Exception review
          </li>
          <li
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--sf2)',
              border: '1px solid var(--line)',
              fontSize: '14px',
            }}
          >
            4. Settlement preparation
          </li>
        </ol>

        <section
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            padding: '20px',
            marginBottom: '20px',
          }}
          aria-labelledby="sum"
        >
          <h2 id="sum" style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
            Outcome per line (each line has exactly one classification)
          </h2>
          <div style={{ display: 'flex', gap: '14px', marginBottom: '6px' }}>
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
              <b style={{ display: 'block', fontFamily: 'var(--fh)', fontSize: '30px' }}>{fullMatchCount}</b>
              <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
                <Chip color="green">FULL MATCH</Chip>
                <br />
                Straight-through, eligible for settlement
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
              <b style={{ display: 'block', fontFamily: 'var(--fh)', fontSize: '30px' }}>{costExceptionCount}</b>
              <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
                <Chip color="amber">COST EXCEPTION</Chip>
                <br />
                Routed to cost review
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
              <b style={{ display: 'block', fontFamily: 'var(--fh)', fontSize: '30px' }}>{quantityExceptionCount}</b>
              <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
                <Chip color="red">QUANTITY EXCEPTION</Chip>
                <br />
                Routed to quantity review
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
              <b style={{ display: 'block', fontFamily: 'var(--fh)', fontSize: '30px' }}>{unmatchedStatementCount}</b>
              <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
                <Chip color="blue">UNMATCHED STATEMENT</Chip>
                <br />
                Routed to quantity review
              </span>
            </div>
            <div
              style={{
                flex: 1,
                border: '1px solid var(--line)',
                borderLeft: '6px solid var(--gy)',
                borderRadius: '6px',
                padding: '12px 14px',
                background: 'var(--sf)',
              }}
            >
              <b style={{ display: 'block', fontFamily: 'var(--fh)', fontSize: '30px' }}>{unmatchedReceiptCount}</b>
              <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
                <Chip color="gray">UNMATCHED RECEIPT</Chip>
                <br />
                Routed to quantity review
              </span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '8px 0 0' }}>
            Straight-through for this batch: {fullMatchCount} of {totalLines} lines ({straightThroughPct}%). The fixture is
            seeded with extra exceptions to exercise every review path. {totalLines - fullMatchCount} exception lines are
            open for human review.
          </p>
        </section>

        <section
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            padding: '20px',
            marginBottom: '20px',
          }}
          aria-labelledby="lines"
        >
          <h2 id="lines" style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
            Line results and basis of determination
          </h2>
          <form style={{ display: 'flex', gap: '16px', alignItems: 'end', marginBottom: '14px' }}>
            <div>
              <label htmlFor="f1" style={{ fontWeight: 600, fontSize: '13px' }}>
                Outcome class
              </label>
              <br />
              <select
                id="f1"
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                style={{
                  padding: '8px 10px',
                  border: '2px solid #7A8580',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'var(--fb)',
                  background: '#fff',
                  color: 'var(--ink)',
                }}
              >
                <option>All outcomes ({totalLines})</option>
                <option>Full Match ({fullMatchCount})</option>
                <option>Cost Exception ({costExceptionCount})</option>
                <option>Quantity Exception ({quantityExceptionCount})</option>
                <option>Unmatched Statement ({unmatchedStatementCount})</option>
                <option>Unmatched Receipt ({unmatchedReceiptCount})</option>
              </select>
            </div>
            <div>
              <label htmlFor="f2" style={{ fontWeight: 600, fontSize: '13px' }}>
                Vendor
              </label>
              <br />
              <select
                id="f2"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                style={{
                  padding: '8px 10px',
                  border: '2px solid #7A8580',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'var(--fb)',
                  background: '#fff',
                  color: 'var(--ink)',
                }}
              >
                <option>All vendors</option>
                <option>Coastal Dairy Co.</option>
                <option>Granite State Bakery</option>
                <option>Atlantic Beverage Dist.</option>
                <option>Yankee Snack Brands</option>
              </select>
            </div>
            <div>
              <label htmlFor="f3" style={{ fontWeight: 600, fontSize: '13px' }}>
                Routing
              </label>
              <br />
              <select
                id="f3"
                value={routingFilter}
                onChange={(e) => setRoutingFilter(e.target.value)}
                style={{
                  padding: '8px 10px',
                  border: '2px solid #7A8580',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'var(--fb)',
                  background: '#fff',
                  color: 'var(--ink)',
                }}
              >
                <option>All</option>
                <option>Cost review</option>
                <option>Quantity review</option>
                <option>No review needed</option>
              </select>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--ink2)', marginLeft: 'auto' }}>
              Showing {results.length} of {totalLines} lines. Text labels accompany every color.
            </span>
          </form>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                <th
                  scope="col"
                  style={{
                    textAlign: 'left',
                    background: 'var(--sf2)',
                    padding: '10px 12px',
                    borderBottom: '2px solid var(--line)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Line
                </th>
                <th
                  scope="col"
                  style={{
                    textAlign: 'left',
                    background: 'var(--sf2)',
                    padding: '10px 12px',
                    borderBottom: '2px solid var(--line)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Vendor / item
                </th>
                <th
                  scope="col"
                  style={{
                    textAlign: 'right',
                    background: 'var(--sf2)',
                    padding: '10px 12px',
                    borderBottom: '2px solid var(--line)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Stmt qty
                </th>
                <th
                  scope="col"
                  style={{
                    textAlign: 'right',
                    background: 'var(--sf2)',
                    padding: '10px 12px',
                    borderBottom: '2px solid var(--line)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Recv qty
                </th>
                <th
                  scope="col"
                  style={{
                    textAlign: 'right',
                    background: 'var(--sf2)',
                    padding: '10px 12px',
                    borderBottom: '2px solid var(--line)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Stmt cost
                </th>
                <th
                  scope="col"
                  style={{
                    textAlign: 'right',
                    background: 'var(--sf2)',
                    padding: '10px 12px',
                    borderBottom: '2px solid var(--line)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Expected cost
                </th>
                <th
                  scope="col"
                  style={{
                    textAlign: 'left',
                    background: 'var(--sf2)',
                    padding: '10px 12px',
                    borderBottom: '2px solid var(--line)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Outcome
                </th>
                <th
                  scope="col"
                  style={{
                    textAlign: 'left',
                    background: 'var(--sf2)',
                    padding: '10px 12px',
                    borderBottom: '2px solid var(--line)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Basis of determination
                </th>
                <th
                  scope="col"
                  style={{
                    textAlign: 'left',
                    background: 'var(--sf2)',
                    padding: '10px 12px',
                    borderBottom: '2px solid var(--line)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Routing
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.line_id}>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--line)',
                      verticalAlign: 'top',
                      fontFamily: 'var(--fm)',
                      fontSize: '13px',
                    }}
                  >
                    {result.line_id}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--line)',
                      verticalAlign: 'top',
                    }}
                  >
                    {result.vendor_item}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--line)',
                      verticalAlign: 'top',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {result.statement_qty || '—'}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--line)',
                      verticalAlign: 'top',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {result.received_qty || '—'}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--line)',
                      verticalAlign: 'top',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {result.statement_cost > 0 ? `$${result.statement_cost.toFixed(2)}` : '—'}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--line)',
                      verticalAlign: 'top',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {result.expected_cost > 0 ? `$${result.expected_cost.toFixed(2)}` : '—'}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--line)',
                      verticalAlign: 'top',
                    }}
                  >
                    <Chip color={getOutcomeColor(result.outcome)}>{result.outcome}</Chip>
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--line)',
                      verticalAlign: 'top',
                    }}
                  >
                    {result.basis}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--line)',
                      verticalAlign: 'top',
                    }}
                  >
                    {result.routing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ display: 'flex', gap: '12px', margin: '16px 0 0' }}>
            <Button onClick={() => navigate('/cost-queue')}>
              Open cost review queue ({costExceptionCount}){' '}
              <svg
                style={{
                  width: '18px',
                  height: '18px',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: '2',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
            <Button variant="secondary" onClick={() => navigate('/quantity-queue')}>
              Open quantity review queue ({quantityExceptionCount + unmatchedStatementCount + unmatchedReceiptCount}){' '}
              <svg
                style={{
                  width: '18px',
                  height: '18px',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: '2',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }}
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
            <Button variant="secondary" onClick={() => navigate('/ap-queue')}>
              Go to AP queue ({fullMatchCount} eligible full matches)
            </Button>
          </p>
        </section>
        <Banner color="blue">
          <svg
            style={{
              width: '18px',
              height: '18px',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <div>
            Exception lines are never posted automatically. Each one is triaged by the AI recommendation step, then held for a
            human decision before it can become settlement-ready.
          </div>
        </Banner>
      </main>
      <footer
        style={{
          padding: '16px 32px',
          borderTop: '1px solid var(--line)',
          fontSize: '13px',
          color: 'var(--ink2)',
        }}
      >
        Pilot build · fixture data only · vendor, item and user names are fictional.
      </footer>
    </div>
  );
}
