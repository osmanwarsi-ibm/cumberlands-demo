import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Chip } from '../../src/components/Chip';

describe('Chip', () => {
  it('renders with green color', () => {
    const { container } = render(<Chip color="green">Full Match</Chip>);
    expect(container.textContent).toBe('Full Match');
  });

  it('renders with amber color', () => {
    const { container } = render(<Chip color="amber">Cost Exception</Chip>);
    expect(container.textContent).toBe('Cost Exception');
  });

  it('renders with red color', () => {
    const { container } = render(<Chip color="red">Quantity Exception</Chip>);
    expect(container.textContent).toBe('Quantity Exception');
  });

  it('renders with blue color', () => {
    const { container } = render(<Chip color="blue">Unmatched Statement</Chip>);
    expect(container.textContent).toBe('Unmatched Statement');
  });

  it('renders with gray color', () => {
    const { container } = render(<Chip color="gray">Unmatched Receipt</Chip>);
    expect(container.textContent).toBe('Unmatched Receipt');
  });
});
