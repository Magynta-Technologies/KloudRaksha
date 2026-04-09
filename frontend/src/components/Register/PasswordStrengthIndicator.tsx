import React, { useEffect, useState } from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const [visibleCriteria, setVisibleCriteria] = useState<{ [key: string]: boolean }>({});

  const criteria = [
    { label: "6+ characters", isValid: password.length >= 6 },
    { label: "1+ uppercase", isValid: /[A-Z]/.test(password) },
    { label: "1+ lowercase", isValid: /[a-z]/.test(password) },
    { label: "1+ number", isValid: /\d/.test(password) },
    { label: "1+ special character", isValid: /[\W_]/.test(password) },
  ];

  useEffect(() => {
    criteria.forEach((criterion) => {
      if (criterion.isValid && !visibleCriteria[criterion.label]) {
        setVisibleCriteria((prev) => ({ ...prev, [criterion.label]: true }));
        setTimeout(() => {
          setVisibleCriteria((prev) => ({ ...prev, [criterion.label]: false }));
        }, 1000); // 1 second delay before vanishing
      }
    });
  }, [password]);

  return (
    <div className="password-strength-indicator mt-2">
      <ul className="list-none p-0">
        {criteria.map((criterion, index) => (
          visibleCriteria[criterion.label] && (
            <li
              key={index}
              className={` text-green-300 transition-all duration-3000 ease-in-out ${
                visibleCriteria[criterion.label] ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
              }`}
            >
              {criterion.label}
            </li>
          )
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthIndicator;
