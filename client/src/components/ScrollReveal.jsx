import { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal — Hiệu ứng cuộn trang chuyên nghiệp
 * Sử dụng IntersectionObserver + CSS transitions
 * 
 * QUAN TRỌNG: Khi animation='none', render ngay lập tức không có hiệu ứng.
 * Hỗ trợ thay đổi animation type dynamically (khi settings load từ API).
 */
export default function ScrollReveal({ 
  children, 
  animation = 'fade-up', 
  delay = 0, 
  duration = 800, 
  threshold = 0.1,
  className = '',
  style = {},
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // If animation is 'none', skip observer entirely
  const isNone = animation === 'none';

  useEffect(() => {
    if (isNone) return; // No observer needed

    const el = ref.current;
    if (!el) return;

    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(el);
          }
        },
        { threshold, rootMargin: '0px 0px -60px 0px' }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [threshold, isNone]);

  // When animation is 'none', render children directly — no wrapper styles
  if (isNone) {
    return <div className={className} style={style}>{children}</div>;
  }

  const getTransform = (anim, visible) => {
    const map = {
      'fade-up':    visible ? 'translateY(0)'   : 'translateY(60px)',
      'fade-down':  visible ? 'translateY(0)'   : 'translateY(-60px)',
      'fade-left':  visible ? 'translateX(0)'   : 'translateX(80px)',
      'fade-right': visible ? 'translateX(0)'   : 'translateX(-80px)',
      'zoom-in':    visible ? 'scale(1)'        : 'scale(0.8)',
      'flip-up':    visible ? 'perspective(800px) rotateX(0deg) translateY(0)' : 'perspective(800px) rotateX(10deg) translateY(50px)',
    };
    return map[anim] || map['fade-up'];
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(animation, isVisible),
        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * StaggerReveal - Mỗi item con xuất hiện lần lượt khi cuộn đến
 * Dùng cho grid/list items
 * 
 * Khi animation='none', render tất cả children ngay lập tức.
 */
export function StaggerReveal({ 
  children, 
  animation = 'fade-up', 
  staggerDelay = 120, 
  baseDelay = 0,
  duration = 700,
  threshold = 0.05,
  className = '',
  style = {},
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const isNone = animation === 'none';

  useEffect(() => {
    if (isNone) return;

    const el = ref.current;
    if (!el) return;

    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(el);
          }
        },
        { threshold, rootMargin: '0px 0px -30px 0px' }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [threshold, isNone]);

  // Flatten children - handle map() results
  const flatChildren = [];
  const flatten = (items) => {
    if (!items) return;
    if (Array.isArray(items)) {
      items.forEach(flatten);
    } else {
      flatChildren.push(items);
    }
  };
  flatten(children);

  // animation = 'none' → render everything immediately
  if (isNone) {
    return (
      <div className={className} style={style}>
        {flatChildren.map((child, i) => (
          <div key={child.key || i}>{child}</div>
        ))}
      </div>
    );
  }

  const getTransform = (anim, visible) => {
    const map = {
      'fade-up':    visible ? 'translateY(0)'   : 'translateY(50px)',
      'fade-down':  visible ? 'translateY(0)'   : 'translateY(-50px)',
      'fade-left':  visible ? 'translateX(0)'   : 'translateX(60px)',
      'fade-right': visible ? 'translateX(0)'   : 'translateX(-60px)',
      'zoom-in':    visible ? 'scale(1)'        : 'scale(0.85)',
      'flip-up':    visible ? 'perspective(600px) rotateX(0deg) translateY(0)' : 'perspective(600px) rotateX(8deg) translateY(40px)',
    };
    return map[anim] || map['fade-up'];
  };

  return (
    <div ref={ref} className={className} style={style}>
      {flatChildren.map((child, i) => {
        if (!child) return null;
        const itemDelay = baseDelay + (i * staggerDelay);
        
        return (
          <div 
            key={child.key || i}
            style={{
              opacity: isVisible ? 1 : 0,
              transform: getTransform(animation, isVisible),
              transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${itemDelay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${itemDelay}ms`,
              willChange: 'opacity, transform',
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
