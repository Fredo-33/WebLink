import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const SelectCustom = ({ options, value, onChange, placeholder, className, style, buttonBgColor, buttonColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
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

  const handleToggle = () => setIsOpen(!isOpen);

  const handleOptionClick = (optionValue) => {
    setIsOpen(false);
    onChange({ target: { value: optionValue } });
  };

  const currentOption = options.find(opt => opt.value === value);

  return (
    <div className={className} style={{ ...style, position: 'relative', display: 'inline-block', minWidth: '200px' }} ref={wrapperRef}>
      <div onClick={handleToggle} style={{ backgroundColor: buttonBgColor, color: buttonColor, padding: '6px 18px', borderRadius: '8.8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {currentOption ? currentOption.label : placeholder}
        <span style={{ right: '6px', fontSize: '12px', position: 'absolute', color: 'lime' }}>▼</span>
      </div>
      {isOpen && (
        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'rgba(121, 122, 128, 0.7)', borderRadius: '8.8px', marginTop: '6px', listStyleType: 'none', padding: '8px', zIndex: 1000, textAlign: 'center' }}>
          {options.map((option, index) => {
            const needsMargin = [ "default","bac","res2","res3","res4","ri49", ].includes(option.value);

            const backgroundColor = hoveredOption === option.value ? 'rgba(255,255,255,0.72)' : (option.value === value ? 'lime' : 'transparent');
            const color = hoveredOption === option.value ? 'red' : (option.value === value ? 'white' : 'white');

            return (
              <li key={index} onClick={() => handleOptionClick(option.value)} onMouseEnter={() => setHoveredOption(option.value)} onMouseLeave={() => setHoveredOption(null)} style={{ padding: '0 16px', cursor: 'pointer', color: color, backgroundColor: backgroundColor, marginBottom: needsMargin ? '10px' : '0', borderRadius: '8px', marginLeft: '8px', marginRight: '8px' }}>
                {option.label}
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