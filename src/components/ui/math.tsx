'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathProps {
  children: string;
  display?: boolean;
  className?: string;
}

export function Math({ children, display = false, className = '' }: MathProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(children, containerRef.current, {
          displayMode: display,
          throwOnError: false,
          trust: true,
          strict: false,
        });
      } catch (error) {
        console.error('KaTeX render error:', error);
        if (containerRef.current) {
          containerRef.current.textContent = children;
        }
      }
    }
  }, [children, display]);

  return <span ref={containerRef} className={className} />;
}

// 문자열에서 $...$ 또는 $$...$$ 패턴을 찾아 수식 렌더링
interface MathTextProps {
  children: string;
  className?: string;
}

export function MathText({ children, className = '' }: MathTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // $$ ... $$ (display mode) 먼저 처리
    let html = children.replace(
      /\$\$([^$]+)\$\$/g,
      (_, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
            trust: true,
            strict: false,
          });
        } catch {
          return `$$${math}$$`;
        }
      }
    );

    // $ ... $ (inline mode) 처리
    html = html.replace(
      /\$([^$]+)\$/g,
      (_, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: false,
            throwOnError: false,
            trust: true,
            strict: false,
          });
        } catch {
          return `$${math}$`;
        }
      }
    );

    // \frac{}{} 같은 raw LaTeX도 처리 ($ 없이 사용된 경우)
    html = html.replace(
      /\\frac\{([^}]+)\}\{([^}]+)\}/g,
      (match) => {
        try {
          return katex.renderToString(match, {
            displayMode: false,
            throwOnError: false,
            trust: true,
            strict: false,
          });
        } catch {
          return match;
        }
      }
    );

    containerRef.current.innerHTML = html;
  }, [children]);

  return <div ref={containerRef} className={className} />;
}

// 분수를 직관적으로 표시하는 컴포넌트
interface FractionProps {
  numerator: number | string;
  denominator: number | string;
  className?: string;
}

export function Fraction({ numerator, denominator, className = '' }: FractionProps) {
  return (
    <Math className={className}>
      {`\\frac{${numerator}}{${denominator}}`}
    </Math>
  );
}
