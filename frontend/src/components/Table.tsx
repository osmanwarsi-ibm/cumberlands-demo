/**
 * Table component matching wireframe design
 */

import React, { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string | number;
}

export function Table<T>({ data, columns, keyExtractor }: TableProps<T>) {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
      }}
    >
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              style={{
                textAlign: 'left',
                background: 'var(--sf2)',
                padding: '10px 12px',
                borderBottom: '2px solid var(--line)',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
              }}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              style={{
                padding: '20px 12px',
                textAlign: 'center',
                color: 'var(--ink2)',
              }}
            >
              No items to display
            </td>
          </tr>
        ) : (
          data.map((item) => (
            <tr key={keyExtractor(item)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--line)',
                    verticalAlign: 'top',
                  }}
                >
                  {column.render
                    ? column.render(item)
                    : String((item as any)[column.key] || '')}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
