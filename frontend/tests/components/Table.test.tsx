import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Table } from '../../src/components/Table';

interface TestItem {
  id: number;
  name: string;
  value: string;
}

describe('Table', () => {
  it('renders table with data', () => {
    const data: TestItem[] = [
      { id: 1, name: 'Item 1', value: 'Value 1' },
      { id: 2, name: 'Item 2', value: 'Value 2' },
    ];

    const columns = [
      { key: 'name', header: 'Name' },
      { key: 'value', header: 'Value' },
    ];

    const { container } = render(
      <Table
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
      />
    );

    expect(container.textContent).toContain('Item 1');
    expect(container.textContent).toContain('Value 1');
  });

  it('renders empty state when data is empty', () => {
    const columns = [
      { key: 'name', header: 'Name' },
      { key: 'value', header: 'Value' },
    ];

    const { container } = render(
      <Table<TestItem>
        data={[]}
        columns={columns}
        keyExtractor={(item) => item.id}
      />
    );

    expect(container.textContent).toContain('No items to display');
  });

  it('renders with custom render function', () => {
    const data: TestItem[] = [
      { id: 1, name: 'Item 1', value: 'Value 1' },
    ];

    const columns = [
      { key: 'name', header: 'Name' },
      {
        key: 'value',
        header: 'Value',
        render: (item: TestItem) => <strong>{item.value}</strong>,
      },
    ];

    const { container } = render(
      <Table
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
      />
    );

    const strong = container.querySelector('strong');
    expect(strong?.textContent).toBe('Value 1');
  });
});
