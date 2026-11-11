export default function Container({ className = "", children }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-4 sm:px-6 md:px-12 ${className}`}>{children}</div>;
}