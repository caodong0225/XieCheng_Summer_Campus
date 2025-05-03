import React, { createContext, useState, useContext, useEffect } from 'react';
import Confetti from 'react-confetti';


const ConfettiContext = createContext();

export const useConfetti = () => useContext(ConfettiContext);

export const ConfettiProvider = ({ DOMready, children }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [recycle, setRecycle] = useState(true);

  useEffect(() => {
    if (DOMready && showConfetti) {
      setTimeout(() => {setRecycle(false)}, 3000)
    }
  }, [DOMready, showConfetti])

  const onConfettiComplete = (c) => {
    setShowConfetti(false)
  }

  return (
    <ConfettiContext.Provider value={{ showConfetti, setShowConfetti }}>
      {children}
      {DOMready && showConfetti && <div id="hello-world">
        <Confetti
          numberOfPieces={800}
          recycle={recycle}
          gravity={0.04}
          onConfettiComplete={onConfettiComplete}
        />
      </div>}
    </ConfettiContext.Provider>
  );
};

