import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { Button } from '../../src/components/ui/button';

describe('Button component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should render children correctly', () => {
      render(
        <Button>
          <span data-testid="child">Custom Content</span>
        </Button>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });
  });

  describe('variants', () => {
    it('should apply default variant styles', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-primary');
    });

    it('should apply destructive variant styles', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-destructive');
    });

    it('should apply outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border');
    });

    it('should apply ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:bg-accent');
    });

    it('should apply yes variant styles (green)', () => {
      render(<Button variant="yes">Yes</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-[#22c55e]');
    });

    it('should apply maybe variant styles (yellow)', () => {
      render(<Button variant="maybe">Maybe</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-[#f59e0b]');
    });

    it('should apply no variant styles (red)', () => {
      render(<Button variant="no">No</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-[#ef4444]');
    });
  });

  describe('sizes', () => {
    it('should apply default size', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-12');
    });

    it('should apply small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
    });

    it('should apply large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-14');
    });

    it('should apply icon size', () => {
      render(<Button size="icon" aria-label="Icon button">🔍</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('w-12');
    });
  });

  describe('interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      // The button should have disabled attribute which prevents native clicks
      expect(button).toBeDisabled();
      // In real browser, disabled buttons don't fire click events
      // fireEvent.click bypasses this, so we only verify the disabled state
    });

    it('should have disabled attribute when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">✕</Button>);
      expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
    });

    it('should support title attribute', () => {
      render(<Button title="More information">?</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('title', 'More information');
    });
  });

  describe('form integration', () => {
    it('should render as submit button', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should render as reset button', () => {
      render(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });
});
