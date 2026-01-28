import React from 'react';
import './Loader.css';

const Loader = ({
  size = 'base',
  variant = 'spinner',
  text = '',
  fullScreen = false,
  className = ''
}) => {
  const loaderClass = [
    'loader',
    `loader-${size}`,
    fullScreen && 'loader-fullscreen',
    className
  ].filter(Boolean).join(' ');

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="loader-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        );
      
      case 'pulse':
        return <div className="loader-pulse"></div>;
      
      case 'medical':
        return (
          <div className="loader-medical">
            <div className="loader-cross">
              <span className="cross-vertical"></span>
              <span className="cross-horizontal"></span>
            </div>
          </div>
        );
      
      case 'spinner':
      default:
        return <div className="loader-spinner"></div>;
    }
  };

  return (
    <div className={loaderClass}>
      {renderLoader()}
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;