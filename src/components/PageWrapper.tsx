import React from "react";

const PageWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <main
      className={`min-h-screen p-6 md:p-8 lg:p-10 transition-all ${className}`}
    >
      <div className="max-w-[1400px] mx-auto">{children}</div>
    </main>
  );
};

export default PageWrapper;
