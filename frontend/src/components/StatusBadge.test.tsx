import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('muestra Pendiente cuando el estado es pending', () => {
    render(<StatusBadge status="pending" />);

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('muestra Consumida cuando el estado es consumed', () => {
    render(<StatusBadge status="consumed" />);

    expect(screen.getByText('Consumida')).toBeInTheDocument();
  });
});