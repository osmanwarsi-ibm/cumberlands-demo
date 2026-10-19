/**
 * StatementIntakePage - Statement ingestion and validation
 * Matches wireframe_statement_intake_from_login.html design exactly
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth';
import { intakeAPI, reconciliationAPI } from '../api/client';
import { Chip } from '../components/Chip';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';

const FIXTURE_OPTIONS = [
  {
    value: 'DSD-STMT-2026-W41',
    label: 'DSD-STMT-2026-W41 · Mixed vendors, 62 lines (all five outcome classes)',
  },
  {
    value: 'DSD-STMT-2026-W41-LOWCTX',
    label: 'DSD-STMT-2026-W41-LOWCTX · Low-context cases, 14 lines',
  },
  {
    value: 'DSD-STMT-2026-W41-MALFORMED',
    label: 'DSD-STMT-2026-W41-MALFORMED · Malformed structure sample, 9 lines',
  },
];

interface QuarantineItem {
  line_id: string;
  vendor_item: string;
  disposition: string;
  reason: string;
}

export function StatementIntakePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedFixture, setSelectedFixture] = useState('DSD-STMT-2026-W41');
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);
  const [totalLines, setTotalLines] = useState<number>(0);
  const [acceptedLines, setAcceptedLines] = useState<number>(0);
  const [rejectedLines, setRejectedLines] = useState<number>(0);
  const [quarantineItems, setQuarantineItems] = useState<QuarantineItem[]>([]);
  const [ingestAt, setIngestAt] = useState<string>('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const handleIngest = async () => {
    setIsIngesting(true);
    try {
      const response = await intakeAPI.ingestBatch({
        source_type: 'statement_file',
        source_identifier: selectedFixture,
      });

      setBatchId(response.batch_id);
      setBatchStatus(response.status);
      setTotalLines(response.total_lines);
      setAcceptedLines(response.accepted_lines);
      setRejectedLines(response.rejected_lines);
      setIngestAt(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');

      // Mock quarantine items from response
      const mockQuarantine: QuarantineItem[] = response.quarantine_reasons.map((q) => ({
        line_id: q.line_id,
        vendor_item: 'Vendor · Item (SKU)',
        disposition: 'QUARANTINED',
        reason: q.reason,
      }));
      setQuarantineItems(mockQuarantine);
    } catch (error) {
      console.error('Ingestion failed:', error);
      alert('Ingestion failed. Please try again.');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleRunMatch = async () => {
    if (!batchId) return;
    setIsMatching(true);
    try {
      await reconciliationAPI.runMatch(batchId);
      navigate(`/batches/${batchId}`);
    } catch (error) {
      console.error('Match run failed:', error);
      alert('Match run failed. Please try again.');
      setIsMatching(false);
    }
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
        <nav
          style={{ display: 'flex', gap: '4px', height: '64px' }}
          aria-label="Primary"
        >
          <a
            href="/intake"
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
            Statement intake
          </a>
          <a
            href={batchId ? `/batches/${batchId}` : '#'}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
              borderBottom: '4px solid transparent',
              cursor: batchId ? 'pointer' : 'not-allowed',
              opacity: batchId ? 1 : 0.5,
            }}
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
            onClick={() => {
              signOut();
              navigate('/login');
            }}
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
        Pilot environment: fixture data only. Statement sources below are approved sample files, not live vendor feeds.
      </div>
      <main id="main" style={{ width: '100%', padding: '24px 32px 48px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '0 0 8px' }}>
          <a href="/login" style={{ color: 'var(--bl)' }}>
            Sign in
          </a>{' '}
          / Statement intake · route /intake
        </p>
        <h1 style={{ fontFamily: 'var(--fh)', fontSize: '30px', margin: '0 0 6px' }}>Statement intake</h1>
        <p style={{ color: 'var(--ink2)', margin: '0 0 20px', fontSize: '16px' }}>
          Load an approved fixture statement, review validation results, then run the three-way match for the batch.
        </p>
        <ol
          style={{
            display: 'flex',
            gap: 0,
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
              background: 'var(--prd)',
              color: '#fff',
              fontWeight: 700,
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            1. Intake and validate
          </li>
          <li
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--sf2)',
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
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
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

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ flex: '0.8 1 0', minWidth: 0 }}>
            <section
              style={{
                background: 'var(--sf)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '20px',
                marginBottom: '20px',
              }}
              aria-labelledby="src"
            >
              <h2 id="src" style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                1. Choose statement source
              </h2>
              <form>
                <label htmlFor="fx" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                  Approved fixture statement
                </label>
                <select
                  id="fx"
                  name="fx"
                  value={selectedFixture}
                  onChange={(e) => setSelectedFixture(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #7A8580',
                    borderRadius: '4px',
                    fontSize: '15px',
                    fontFamily: 'var(--fb)',
                    background: '#fff',
                    color: 'var(--ink)',
                  }}
                >
                  {FIXTURE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '13px', color: 'var(--ink2)', margin: '6px 0 16px' }}>
                  Source type: statement file (fixture). Business-hour sample week 41.
                </p>
                <Button onClick={handleIngest} disabled={isIngesting}>
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  {isIngesting ? 'Ingesting...' : 'Ingest selected statement'}
                </Button>
              </form>
            </section>
            {batchId && (
              <section
                style={{
                  background: 'var(--sf)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  padding: '20px',
                }}
                aria-labelledby="bat"
              >
                <h2 id="bat" style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                  Batch record
                </h2>
                <dl style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: '6px 14px', margin: 0 }}>
                  <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Batch ID</dt>
                  <dd style={{ margin: 0, fontWeight: 600, fontFamily: 'var(--fm)', fontSize: '13px' }}>
                    BATCH-{batchId}
                  </dd>
                  <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Source identifier</dt>
                  <dd style={{ margin: 0, fontWeight: 600, fontFamily: 'var(--fm)', fontSize: '13px' }}>
                    {selectedFixture}
                  </dd>
                  <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Ingested at</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{ingestAt}</dd>
                  <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Ingested by</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>
                    {user?.username} ({user?.role.replace(/_/g, ' ')})
                  </dd>
                  <dt style={{ color: 'var(--ink2)', fontSize: '13px' }}>Ingest status</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>
                    <Chip color={rejectedLines > 0 ? 'amber' : 'green'}>
                      <svg
                        style={{
                          width: '14px',
                          height: '14px',
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
                      {batchStatus}
                    </Chip>
                  </dd>
                </dl>
              </section>
            )}
          </div>

          <div style={{ flex: '1.2 1 0', minWidth: 0 }}>
            {batchId && (
              <>
                <section
                  style={{
                    background: 'var(--sf)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    padding: '20px',
                    marginBottom: '20px',
                  }}
                  aria-labelledby="val"
                >
                  <h2 id="val" style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                    2. Validation results
                  </h2>
                  <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                    <div
                      style={{
                        flex: 1,
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        padding: '12px 14px',
                        background: 'var(--sf)',
                      }}
                    >
                      <b style={{ display: 'block', fontFamily: 'var(--fh)', fontSize: '28px' }}>{totalLines}</b>
                      <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>Lines received</span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        padding: '12px 14px',
                        background: 'var(--sf)',
                      }}
                    >
                      <b style={{ display: 'block', fontFamily: 'var(--fh)', fontSize: '28px' }}>{acceptedLines}</b>
                      <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>Normalized and accepted</span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        padding: '12px 14px',
                        background: 'var(--sf)',
                      }}
                    >
                      <b style={{ display: 'block', fontFamily: 'var(--fh)', fontSize: '28px' }}>{rejectedLines}</b>
                      <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>Quarantined or rejected</span>
                    </div>
                  </div>
                  {rejectedLines > 0 && (
                    <>
                      <Banner color="amber">
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
                          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                          <path d="M12 9v4M12 17h.01" />
                        </svg>
                        <div>
                          <b>{rejectedLines} lines were not matched.</b> They are held in quarantine and are visible below
                          with the reason. The other {acceptedLines} lines can be matched now.
                        </div>
                      </Banner>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <caption
                          style={{
                            textAlign: 'left',
                            paddingBottom: '6px',
                            fontSize: '13px',
                            color: 'var(--ink2)',
                          }}
                        >
                          Quarantined and rejected lines
                        </caption>
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
                                textAlign: 'left',
                                background: 'var(--sf2)',
                                padding: '10px 12px',
                                borderBottom: '2px solid var(--line)',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              Disposition
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
                              Reason
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {quarantineItems.map((item, idx) => (
                            <tr key={idx}>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  borderBottom: '1px solid var(--line)',
                                  verticalAlign: 'top',
                                  fontFamily: 'var(--fm)',
                                  fontSize: '13px',
                                }}
                              >
                                {item.line_id}
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  borderBottom: '1px solid var(--line)',
                                  verticalAlign: 'top',
                                }}
                              >
                                {item.vendor_item}
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  borderBottom: '1px solid var(--line)',
                                  verticalAlign: 'top',
                                }}
                              >
                                <Chip color="amber">{item.disposition}</Chip>
                              </td>
                              <td
                                style={{
                                  padding: '10px 12px',
                                  borderBottom: '1px solid var(--line)',
                                  verticalAlign: 'top',
                                }}
                              >
                                {item.reason}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </section>

                <section
                  style={{
                    background: 'var(--sf)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    padding: '20px',
                    marginBottom: '20px',
                  }}
                  aria-labelledby="run"
                >
                  <h2 id="run" style={{ fontFamily: 'var(--fh)', fontSize: '20px', margin: '0 0 12px' }}>
                    3. Run three-way match
                  </h2>
                  <p style={{ margin: '0 0 14px' }}>
                    Compares the statement, store receipts and invoice-related records for the {acceptedLines} accepted
                    lines using the pilot tolerances (quantity: more than 2 units and more than 2%; cost: more than $0.05
                    per unit).
                  </p>
                  <p style={{ display: 'flex', gap: '14px', alignItems: 'center', margin: 0 }}>
                    <Button onClick={handleRunMatch} disabled={isMatching || acceptedLines === 0}>
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
                        <polygon points="6 3 20 12 6 21 6 3" />
                      </svg>
                      {isMatching ? 'Running match...' : `Run match on batch BATCH-${batchId}`}
                    </Button>
                    <span style={{ fontSize: '13px', color: 'var(--ink2)' }}>
                      Runs locally on fixture data. No external system is called.
                    </span>
                  </p>
                </section>
              </>
            )}
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
        Pilot build · fixture data only · vendor, item and user names are fictional.
      </footer>
    </div>
  );
}
