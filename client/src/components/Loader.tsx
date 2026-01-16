const Loader = () => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="w-14 h-14 rounded-full border-4 border-white border-t-transparent animate-spin" />
    </div>
  );
};

export default Loader;
