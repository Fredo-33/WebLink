import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const SelectCustom = ({ options, value, onChange, placeholder, className, style, buttonBgColor, buttonColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  useEffect(() => {
    const checkIsMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 600);
      }
    };

    checkIsMobile();

    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleOptionClick = (optionValue) => {
    setIsOpen(false);
    onChange({ target: { value: optionValue } });
  };

  const currentOption = options.find(opt => opt.value === value);

  if (isMobile) {
    return null;
  }

  return (

    <div className={className} style={{ ...style }} ref={wrapperRef}>
      <div onClick={handleToggle} style={{ backgroundColor: buttonBgColor, color: buttonColor, padding: '6px 18px', borderRadius: '8.8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {currentOption ? currentOption.label : placeholder}
      </div>
      {isOpen && (
        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: buttonBgColor, borderRadius: '8.8px', marginTop: '6px', listStyleType: 'none', padding: '8px', zIndex: 1000, textAlign: 'center' }}>
          {options.map((option, index) => {
            const needsMargin = [ "default","bac","res2","res3","res4","ri49","gir", ].includes(option.value);
            return (
              <li key={index} onClick={() => handleOptionClick(option.value)} style={{ padding: '0', cursor: 'pointer', color: buttonColor, marginBottom: needsMargin ? '10px' : '0', borderRadius: '8px', marginLeft: '8px', marginRight: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'transform 0.18s ease-in-out', transformOrigin: 'center center', }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.16)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
                {option.value === value ? <span style={{ marginRight: '12px' }}>(</span> : null}
                {option.label}
                {option.value === value ? <span style={{ marginLeft: '12px' }}>)</span> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

SelectCustom.propTypes = {
  options: PropTypes.array.isRequired,value: PropTypes.string.isRequired,onChange: PropTypes.func.isRequired,placeholder: PropTypes.string,className: PropTypes.string,style: PropTypes.object,buttonBgColor: PropTypes.string,buttonColor: PropTypes.string,
};

export default SelectCustom