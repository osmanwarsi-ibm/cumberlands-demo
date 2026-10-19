import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Button } from '../../src/components/Button';

describe('Button', () => {
  it('renders with children', () => {
    const { container } = render(<Button>Click me</Button>);
    expect(container.textContent).toBe('Click me');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<Button onClick={onClick}>Click me</Button>);
    const button = container.querySelector('button');
    if (button) {
      fireEvent.click(button);
    }
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders primary variant by default', () => {
    const { container } = render(<Button>Primary</Button>);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('renders secondary variant', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const button = container.querySelector('button');
    expect(button?.disabled).toBe(true);
  });
});
