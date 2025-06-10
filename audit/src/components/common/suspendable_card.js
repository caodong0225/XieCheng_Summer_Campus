"use client";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";


/**
 * 
 * @param {string} titleText 
 * @param {'flex flex-col' | 'p-4 mt-3' | ...} className 
 * @param {JSX} fallback 
 * @param {boolean} isLoading 
 * @param {boolean} isValidating  
 */
export default function SuspendableCard({
  titleText,
  className,
  isLoading, isValidating,
  fallback,
  children,
}) {
  const spinner = <Spin indicator={<LoadingOutlined spin />} />;
  const spinEffect = false;
  const pulseEffect = true;

  return (
    <div className="bg-white shadow-md rounded w-full overflow-hidden">
      <h2 className={`text-2xl font-bold p-4 pb-1 ${(pulseEffect && isValidating) ? 'animate-pulse' : ''}`}>
        {titleText}
        {spinEffect && isValidating && <span className='ml-3'>{spinner}</span>}
      </h2>
      <div className={className}>
        {isLoading && fallback}
        {children}
      </div>
    </div>
  )
};