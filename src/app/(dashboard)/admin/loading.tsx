import { PageLoader } from "@/components/shared/page-loader";

export default function AdminLoading() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[65vh] w-full animate-in fade-in duration-300">
      <PageLoader 
        message="Memuat data administrasi..." 
        subMessage="SD - SMP Islam Al-Azhar Cairo Palembang" 
      />
    </div>
  );
}
