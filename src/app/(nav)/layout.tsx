import BottomNav from '@/components/BottomNav';

export default function NavLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="pb-20 min-h-[100dvh]">{children}</main>
      <BottomNav />
    </>
  );
}
