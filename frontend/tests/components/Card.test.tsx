import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from '../../src/components/Card';

describe('Card', () => {
  it('renders children', () => {
    const { container } = render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(container.textContent).toContain('Card content');
  });

  it('renders with title', () => {
    const { container } = render(
      <Card title="Test Card">
        <p>Card content</p>
      </Card>
    );
    expect(container.textContent).toContain('Test Card');
    expect(container.textContent).toContain('Card content');
  });

  it('renders without title', () => {
    const { container } = render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    const h2 = container.querySelector('h2');
    expect(h2).toBeNull();
  });
});
