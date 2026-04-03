'use client';
import { navGroups, kbarExtraItems } from '@/config/nav-config';
import { KBarAnimator, KBarPortal, KBarPositioner, KBarProvider, KBarSearch } from 'kbar';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import RenderResults from './render-result';
import useThemeSwitching from './use-theme-switching';
import { useFilteredNavGroups } from '@/hooks/use-nav';

export default function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Sidebar items go into "Pages", extras keep their own group labels
  const sidebarFiltered = useFilteredNavGroups(navGroups);
  const extraFiltered = useFilteredNavGroups(kbarExtraItems);

  const actions = useMemo(() => {
    const navigateTo = (url: string) => router.push(url);

    // Sidebar items → "Pages" section
    const sidebarActions = sidebarFiltered
      .flatMap((g) => g.items)
      .filter((item) => item.url !== '#')
      .map((item) => ({
        id: `${item.title.toLowerCase().replace(/\s+/g, '-')}Action`,
        name: item.title,
        shortcut: item.shortcut,
        keywords: item.title.toLowerCase(),
        section: 'Pages',
        subtitle: `Go to ${item.title}`,
        perform: () => navigateTo(item.url)
      }));

    // Extra items → keep their group label as section (Pages / Account)
    const extraActions = extraFiltered.flatMap((group) =>
      group.items
        .filter((item) => item.url !== '#')
        .map((item) => ({
          id: `${item.title.toLowerCase().replace(/\s+/g, '-')}Action`,
          name: item.title,
          shortcut: item.shortcut,
          keywords: item.title.toLowerCase(),
          section: group.label || 'Pages',
          subtitle: `Go to ${item.title}`,
          perform: () => navigateTo(item.url)
        }))
    );

    return [...sidebarActions, ...extraActions];
  }, [router, sidebarFiltered, extraFiltered]);

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}
const KBarComponent = ({ children }: { children: React.ReactNode }) => {
  useThemeSwitching();

  return (
    <>
      <KBarPortal>
        <KBarPositioner className='bg-background/80 fixed inset-0 z-99999 p-0! backdrop-blur-sm'>
          <KBarAnimator className='bg-card text-card-foreground relative mt-64! w-full max-w-[600px] -translate-y-12! overflow-hidden rounded-lg border shadow-lg'>
            <div className='bg-card border-border sticky top-0 z-10 border-b'>
              <KBarSearch className='bg-card w-full border-none px-6 py-4 text-lg outline-hidden focus:ring-0 focus:ring-offset-0 focus:outline-hidden' />
            </div>
            <div className='max-h-[400px]'>
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
