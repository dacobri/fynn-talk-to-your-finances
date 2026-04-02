'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Plotly
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface PlotlyChartProps {
  chartJson: Record<string, unknown>;
}

export function PlotlyChart({ chartJson }: PlotlyChartProps) {
  const data = (chartJson.data as Plotly.Data[]) || [];
  const layout = (chartJson.layout as Partial<Plotly.Layout>) || {};

  const mergedLayout: Partial<Plotly.Layout> = {
    ...layout,
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 48, b: 48, l: 48, r: 24 },
    font: { family: 'inherit', size: 12 },
  };

  return (
    <div className='w-full overflow-hidden rounded-xl border bg-card p-3'>
      <Plot
        data={data}
        layout={mergedLayout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: '380px' }}
        useResizeHandler
      />
    </div>
  );
}
