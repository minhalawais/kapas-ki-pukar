export function PortalFooter({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <footer className={`fixed inset-x-0 bottom-0 z-30 border-t border-[#2E8D5D] bg-[#66BE83] px-4 py-0.5 text-center text-[11px] leading-4 text-white shadow-[0_-1px_0_rgba(255,255,255,0.55)_inset,0_-6px_14px_rgba(5,63,41,0.12)] ${fullWidth ? "" : "lg:start-sidebar"}`}>
      <span className="font-medium opacity-95">Powered by </span>
      <span className="font-semibold text-[#174F86]">Fruit of Sustainability</span>
    </footer>
  );
}
