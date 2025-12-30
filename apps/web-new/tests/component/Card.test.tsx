import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../src/components/ui/card';

describe('Card component', () => {
  describe('Card', () => {
    it('should render as div by default', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content');
      expect(card.tagName).toBe('DIV');
    });

    it('should render as button when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable</Card>);
      const card = screen.getByRole('button');
      expect(card.tagName).toBe('BUTTON');
    });

    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Click me</Card>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should apply default variant styles', () => {
      render(<Card>Default</Card>);
      const card = screen.getByText('Default');
      expect(card.className).toContain('bg-card');
    });

    it('should apply elevated variant styles', () => {
      render(<Card variant="elevated">Elevated</Card>);
      const card = screen.getByText('Elevated');
      expect(card.className).toContain('shadow-lg');
    });

    it('should apply glass variant styles', () => {
      render(<Card variant="glass">Glass</Card>);
      const card = screen.getByText('Glass');
      expect(card.className).toContain('backdrop-blur-md');
    });

    it('should apply custom className', () => {
      render(<Card className="custom-class">Custom</Card>);
      const card = screen.getByText('Custom');
      expect(card.className).toContain('custom-class');
    });

    it('should apply padding variants', () => {
      render(<Card padding="compact">Compact</Card>);
      const card = screen.getByText('Compact');
      expect(card.className).toContain('p-4');
    });
  });

  describe('CardHeader', () => {
    it('should render children', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('should apply comfortable padding by default', () => {
      render(<CardHeader>Header</CardHeader>);
      const header = screen.getByText('Header');
      expect(header.className).toContain('p-5');
    });

    it('should apply custom padding', () => {
      render(<CardHeader padding="compact">Header</CardHeader>);
      const header = screen.getByText('Header');
      expect(header.className).toContain('p-4');
    });
  });

  describe('CardTitle', () => {
    it('should render as h3 by default', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Title');
    });

    it('should apply title styles', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByRole('heading');
      expect(title.className).toContain('font-semibold');
    });
  });

  describe('CardDescription', () => {
    it('should render description text', () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('should apply muted text color', () => {
      render(<CardDescription>Desc</CardDescription>);
      const desc = screen.getByText('Desc');
      expect(desc.className).toContain('text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('should render children with padding', () => {
      render(<CardContent>Content here</CardContent>);
      const content = screen.getByText('Content here');
      expect(content.className).toContain('p-');
    });
  });

  describe('CardFooter', () => {
    it('should render footer content', () => {
      render(<CardFooter>Footer actions</CardFooter>);
      expect(screen.getByText('Footer actions')).toBeInTheDocument();
    });

    it('should apply flex layout', () => {
      render(<CardFooter>Footer</CardFooter>);
      const footer = screen.getByText('Footer');
      expect(footer.className).toContain('flex');
    });
  });

  describe('composed card', () => {
    it('should render full card composition', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>Main content area</CardContent>
          <CardFooter>Footer with actions</CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card description text')).toBeInTheDocument();
      expect(screen.getByText('Main content area')).toBeInTheDocument();
      expect(screen.getByText('Footer with actions')).toBeInTheDocument();
    });
  });
});
